import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
	if (transporter) {
		return transporter;
	}

	const smtpHost = env.SMTP_HOST;
	const smtpPort = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
	const smtpUser = env.SMTP_USERNAME || env.SMTP_USER;
	const smtpPassword = env.SMTP_PASSWORD;
	const smtpFrom = env.SMTP_FROM;

	if (!smtpHost || !smtpUser || !smtpPassword) {
		console.warn(
			'SMTP configuration incomplete. Missing:',
			{
				host: !smtpHost,
				user: !smtpUser,
				password: !smtpPassword
			}
		);
		return null;
	}

	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpPort === 465,
		auth: {
			user: smtpUser,
			pass: smtpPassword
		}
	});

	return transporter;
}

export interface SendEmailOptions {
	to: string;
	subject: string;
	html?: string;
	text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
	const transporter = getTransporter();

	if (!transporter) {
		console.error('Cannot send email: SMTP not configured');
		throw new Error('Email service is not configured. Please set SMTP environment variables.');
	}

	const smtpFrom = env.SMTP_FROM || env.SMTP_USERNAME || env.SMTP_USER;

	if (!smtpFrom) {
		throw new Error('SMTP_FROM is not configured');
	}

	try {
		await transporter.sendMail({
			from: smtpFrom,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text || options.html?.replace(/<[^>]*>/g, '')
		});

		console.log(`Password reset email sent to ${options.to}`);
	} catch (error) {
		console.error('Failed to send email:', error);
		throw error;
	}
}

