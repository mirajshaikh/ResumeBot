/** @format */

const { Composer, Markup, Scenes, session, Telegraf } = require('telegraf');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const token = '5168205373:AAE0K8kzskE-6U-yyz-5Q1CKdQd5YoubB3k';
if (token === undefined) {
	throw new Error('BOT_TOKEN must be provided!');
}

// Load the docx file as binary content

let input = {
	fullName: '',
	fatherName: '',
	dob: '',
	mobile: '',
	email: '',
	nationality: 'Indian',
	maritialStatus: 'Single',
	launguage: '',
	hobbies: '',
	education: '',
	address: '',
};

function makeResume(inputs) {
	const content = fs.readFileSync(
		path.resolve(__dirname, 'resume.docx'),
		'binary'
	);
	const zip = new PizZip(content);

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
	});

	// Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
	doc.render(inputs);

	const buf = doc.getZip().generate({
		type: 'nodebuffer',
		// compression: DEFLATE adds a compression step.
		// For a 50MB output document, expect 500ms additional CPU time
		compression: 'DEFLATE',
	});

	// buf is a nodejs Buffer, you can either write it to a file or res.send it with express for example.
	// fs.writeFileSync(path.resolve(__dirname, 'resumeOutput.docx'), buf);
	return buf;
}

const stepHandler = new Composer();
stepHandler.command('start', async (ctx) => {
	await ctx.reply('Enter your full name.');
	return ctx.wizard.next();
});
stepHandler.action('start', async (ctx) => {
	await ctx.reply('Enter your full name.');
	return ctx.wizard.next();
});
stepHandler.use((ctx) => {
	ctx.replyWithMarkdown(`Welcome to *Resume Bot!!* _beta_ 🚀
Currently For *Fresher's Resume* only. 😊
We are working to make this more feature rich as we move froward 🤞🏽`);
	ctx.reply(
		`Let's Start making your resume
		type /start or click below`,
		Markup.inlineKeyboard([
			// Markup.button.url('❤️', 'http://telegraf.js.org'),
			Markup.button.callback('➡️ Start', 'start'),
		])
	);
});

const superWizard = new Scenes.WizardScene(
	'super-wizard',
	stepHandler,
	async (ctx) => {
		input.fullName = ctx.update.message.text;
		await ctx.reply(`Enter your Father's Name`);
		return ctx.wizard.next();
	},

	async (ctx) => {
		input.fatherName = ctx.update.message.text;
		await ctx.reply('Enter your Date Of Birth e.g 31/01/1998');
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.dob = ctx.update.message.text;
		await ctx.reply('Enter your Mobile number');
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.mobile = ctx.update.message.text;
		await ctx.reply('Enter your Email id');
		return ctx.wizard.next();
	},

	async (ctx) => {
		input.email = ctx.update.message.text;
		// input.maritialStatus = ctx.callback_query.data;
		await ctx.reply(
			'How many launguages you know? i.e Hindi, English, Marathi...'
		);
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.launguage = ctx.update.message.text;
		await ctx.reply(
			'What are your Hobbies? i.e Playing Games, Singing, Reading Books...'
		);
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.hobbies = ctx.update.message.text;
		await ctx.reply(
			'Whats is your leatest education Qualification? i.e Graduation, 12th, 10th,'
		);
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.education = ctx.update.message.text;

		await ctx.reply('Whats is your current address? Enter your full address');
		return ctx.wizard.next();
	},
	async (ctx) => {
		input.address = ctx.update.message.text;
		await ctx.reply('Please wait...');
		let resume = await makeResume(input);
		await ctx.reply('Creating your Resume...');
		await ctx.replyWithDocument({
			source: resume,
			filename: input.fullName + '-Resume.docx',
		});
		// await ctx.reply(JSON.stringify(input));
		// console.log(input);
		return await ctx.scene.leave();
	}
);

const bot = new Telegraf(token);
const stage = new Scenes.Stage([superWizard], {
	default: 'super-wizard',
});
bot.use(session());
bot.use(stage.middleware());
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
