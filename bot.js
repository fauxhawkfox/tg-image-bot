const TeleBot = require('telebot');
const request = require('request');
const dotenv = require('dotenv').config();


const bot = new TeleBot(process.env.TG_BOT_API);


function pixabayRandomizer(min, max) {
	if (max > 200) {
		max = 199;
	}
	return Math.floor(Math.random() * (max - min + 1)) + min
}




bot.on('/start', msg => {
	msg.reply.text('Hi! This bot is currently being tested. Mind your step. Contact @indigofox with questions or advice.')
	console.log('Contacted by @' + msg.from.username + ' (' + msg.from.id + ').')
});



// return fox images from randomfox.ca
bot.on(/fox*/i, (msg) => {
	let url = 'https://randomfox.ca/floof';
	request({
		url: url,
		// 		json: true
	}, function(error, response, body) {
		let info = JSON.parse(body);
		let now = new Date().toISOString()
			.replace(/T/, ' '). // replace T with a space now
		replace(/\..+/, ''); // delete the dot and everything after
		console.log(now + ': Sent ' + info.link + ' to @' + msg.from.username + ' (' + msg.from.id + ').');
		return msg.reply.photo(info.image, {
			caption: info.link,
			asReply: false
		});
	});
	// 	console.log(processJSON(url));
	// 	return msg.reply.photo(processJSON(url));
});


// return images from Pixabay API
bot.on(/\w/i, (msg) => {
	let query = (msg.text).replace(' ','_')
	let url = `https://pixabay.com/api?key=${process.env.PIXABAY_API}&image_type=photo&min_width=600&min_height=800&per_page=200&q=${query}`;
	// console.log(url);

	request.get(url, {
			json: true
		},
		// 		key: "",
		// 		image_type: 'photo',
		// 		category: 'animals',
		// 		min_width: 600,
		// 		min_height: 800,
		// 		q: 'hyena'
		function(error, res, body) {
			if (error) {
				console.error(error);
				return msg.reply.text('There was an error retrieving results. Please try again.'), {
					notification: false
				}
			}
			// body = JSON.parse(body);

			let now = new Date().toISOString()
				.replace(/T/, ' ') // replace T with a space now
				.replace(/\..+/, ''); // delete the dot and everything after

			let numOfResults = body.totalHits
			// console.log(numOfResults);

			// max per page is 200 results, limited max to that amount of results
			let resultNum = pixabayRandomizer(0, numOfResults).toString();
			// console.log(resultNum);

			let result = body.hits[resultNum];
			// 			console.log(result);
			if (result === undefined) {
				console.error('No results found for query "' + query + '" from @' + msg.from.username + ' (' + msg.from.id + ').');
				return msg.reply.text('Could not retrieve result. Please try another query.', {
					asReply: true
				});
			}
			console.log(now + ': In response to query "' + query + '", sent ' + result.pageURL + ' to @' + msg.from.username + ' (' + msg.from.id + ') from Pixabay.');
			msg.reply.photo(result.largeImageURL, {
				caption: `By Pixabay user ${result.user}.\n${result.pageURL}`,
				asReply: true
			});
		});
	// 	console.log(processJSON(url));
	// 	return msg.reply.photo(processJSON(url));
});



bot.start();