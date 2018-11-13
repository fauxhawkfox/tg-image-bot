const TeleBot = require('telebot');
const request = require('request');
const dotenv = require('dotenv').config();
const winston = require('winston');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log` 
		// - Write all logs error (and below) to `error.log`.
		//
		new winston.transports.File({
			filename: 'error.log',
			level: 'error'
		}),
		new winston.transports.File({
			filename: 'combined.log'
		})
	]
});

if (true) {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}));
}

const bot = new TeleBot(process.env.TG_BOT_API);


function pixabayRandomizer(min, max) {
	if (max > 200) {
		max = 199;
	}
	return Math.floor(Math.random() * (max - min + 1)) + min
}




bot.on('/start', msg => {
	msg.reply.text('Hi! This bot is currently being tested. Mind your step. Contact @indigofox with questions or advice.')
	logger.info('Contacted by @' + msg.from.username + ' (' + msg.from.id + ').')
});



// return fox images from randomfox.ca
bot.on(/fox/i, (msg) => {
	let url = 'https://randomfox.ca/floof';
	request({
		url: url,
		// 		json: true
	}, function(error, response, body) {
		if (error || (response.statusCode.toString())[0] !== '2') {
			logger.error(`Unable to retrieve results from randomfox.ca API. Is it up? (Error code ${response.statusCode})`);
			return msg.reply.text(`There was an error retrieving results from randomfox.ca. Please try again. (Error code ${response.statusCode})`), {
				notification: false,
				asReply: true
			}
		}
		logger.info(response)
		let info = JSON.parse(body);
		let now = new Date().toISOString()
			.replace(/T/, ' '). // replace T with a space now
		replace(/\..+/, ''); // delete the dot and everything after
		logger.info(now + ': Sent ' + info.link + ' to @' + msg.from.username + ' (' + msg.from.id + ').');
		return msg.reply.photo(info.image, {
			caption: info.link,
			asReply: false
		});
	});
	// 	console.log(processJSON(url));
	// 	return msg.reply.photo(processJSON(url));
});


// return images from Pixabay API
bot.on('/pix', (msg) => {
	let query = msg.text
	query = query.replace(/\/((pix)|(flickr))\s/gi, '').replace(/\s/g, '+');

	logger.info(`Received query "${query}" from @${msg.from.username} (${msg.from.id}).`);
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
		function(error, response, body) {
			if (error || (response.statusCode.toString())[0] !== '2') {
				logger.error(`Unable to retrieve results from Pixabay API. Is it up? (Error code ${response.statusCode})`);
				return msg.reply.text(`There was an error retrieving results from Pixabay. Please try again. (Error code ${response.statusCode})`), {
					notification: false,
					asReply: true
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
				logger.error('No results found for query "' + query + '" from @' + msg.from.username + ' (' + msg.from.id + ').');
				return msg.reply.text('Could not retrieve result. Please try another query.', {
					asReply: true
				});
			}
			logger.info(now + ': In response to query "' + query + '", sent ' + result.pageURL + ' to @' + msg.from.username + ' (' + msg.from.id + ') from Pixabay.');
			msg.reply.photo(result.largeImageURL, {
				caption: `By Pixabay user ${result.user}.\n${result.pageURL}`,
				asReply: true
			});
		});
	// 	console.log(processJSON(url));
	// 	return msg.reply.photo(processJSON(url));
});



// these two functions are used to randomize page & photo list selections in the Flickr request, so that we can choose a photo from the entire set of results
function flickrPageRandomizer(pages) {
	let max = pages
	let min = 1
	let pageNum = Math.floor(Math.random() * (max - min + 1)) + min
	return pageNum
}

function flickrPhotoRandomizer(photosThisPage) {
	let max = photosThisPage - 1
	let min = 0
	let photoNum = Math.floor(Math.random() * (max - min + 1)) + min
	return photoNum
}

// these two functions are used to take advantage of Flickr's compressed URL functionality. it encodes the userID/info to shorten it using a mathematical function

function flickrBaseEncode(num) {
	if (typeof num !== 'number') {
		num = parseInt(num);
		var enc = '',
			alpha = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
		var div = num,
			mod;
		while (num >= 58) {
			div = num / 58;
			mod = num - (58 * Math.floor(div));
			enc = '' + alpha.substr(mod, 1) + enc;
			num = Math.floor(div);
		}
		return (div) ? '' + alpha.substr(div, 1) + enc : enc;
	}
}

// function flickrBaseEncode(num, alphabet) {
// let base_count = alphabet.length;
// let encoded = '';
// while (num >= base_count) {
// let div = num/base_count;
// let mod = (num-(base_count*div.valueOf()));
// encoded = alphabet[mod] . encoded;
// num = div.valueOf();
// }

// if (num) encoded = alphabet[num] . encoded;

// return encoded;
// }

// function flickrBaseDecdoe($num, $alphabet) {
// $decoded = 0;
// $multi = 1;
// while (strlen($num) > 0) {
// $digit = $num[strlen($num)-1];
// $decoded += $multi * strpos($alphabet, $digit);
// $multi = $multi * strlen($alphabet);
// $num = substr($num, 0, -1);
// }

// return $decoded;
// }

// fetch images from flickr
bot.on(/\/(flickr)/gi, (msg) => {

	let query = msg.text
	query = query.replace(/\/(flickr)\s/gi, '').replace(/\s/g, '+');

	let now = new Date().toISOString()
		.replace(/T/, ' ') // replace T with a space now
		.replace(/\..+/, ''); // delete the dot and everything after

	logger.info(`Received query "${query}" from @${msg.from.username} (${msg.from.id}).`);

	let url = `https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=${process.env.FLICKR_API}&text=${query}&tag_mode=all&content_type=1&media=photos&per_page=500&format=json&nojsoncallback=1`
	request.get(url, {
			json: true
		},
		// 		key: "",
		// 		image_type: 'photo',
		// 		category: 'animals',
		// 		min_width: 600,
		// 		min_height: 800,
		// 		q: 'hyena'
		function(error, response, body) {
			if (error || (response.statusCode.toString())[0] !== '2') {
				logger.error(`Unable to retrieve results from Flickr API. Is it up? (Error code ${response.statusCode})`);
				return msg.reply.text(`There was an error retrieving results from Flickr. Please try again. (Error code ${response.statusCode})`), {
					notification: false,
					asReply: true
				}
			}
			let pageNum = flickrPageRandomizer(body.photos.pages);
			let photoNum = flickrPhotoRandomizer((body.photos.photo).length)


			// redefine URL to randomize
			url = `https://api.flickr.com/services/rest?method=flickr.photos.search&api_key=${process.env.FLICKR_API}&text=${query}&tag_mode=all&content_type=1&media=photos&per_page=500&format=json&nojsoncallback=1&page=${pageNum}`

			request.get(url, {
					json: true
				},
				// 		key: "",
				// 		image_type: 'photo',
				// 		category: 'animals',
				// 		min_width: 600,
				// 		min_height: 800,
				// 		q: 'hyena'
				function(error, response, newbody) {
					if (error || (response.statusCode.toString())[0] !== '2') {
						logger.error(`Unable to retrieve results from Flickr API. Is it up? (Error code ${response.statusCode})`);
						return msg.reply.text(`There was an error retrieving results from Flickr. Please try again. (Error code ${response.statusCode})`), {
							notification: false,
							asReply: true
						}
					}

					let photo = newbody.photos.photo[photoNum];

					// console.log(resultNum);
					let photoUrl = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_o.png`
					photoUrl = `https://flic.kr/p/${flickrBaseEncode(photo.id)}`

					// 			console.log(result);

					logger.info(now + ': In response to query "' + query + '", sent ' + photoUrl + ' to @' + msg.from.username + ' (' + msg.from.id + ') from Flickr.');
					msg.reply.photo(photoUrl, {
						caption: `"${photo.title}"\nBy Flickr user ${photo.owner}.\n${photoUrl}`,
						asReply: true
					});
				});
		});
});





bot.start()