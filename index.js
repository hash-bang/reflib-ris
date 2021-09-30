var events = require('events');
var stream = require('stream');

var _fieldTranslations = { // Map of RIS fields to RefLib fields
	'A1': {reflib: 'authors', isArray: true},
	'A2': {reflib: 'authors', isArray: true, split: true},
	'A3': {reflib: 'authors', isArray: true, split: true},
	'A4': {reflib: 'authors', isArray: true, split: true},
	'AB': {reflib: 'abstract'},
	'AU': {reflib: 'authors', isArray: true},
	'C1': {reflib: 'custom1'},
	'C2': {reflib: 'custom2'},
	'C3': {reflib: 'custom3'},
	'C4': {reflib: 'custom4'},
	'C5': {reflib: 'custom5'},
	'C6': {reflib: 'custom6'},
	'C7': {reflib: 'custom7'},
	'C8': {reflib: 'custom8'},
	'CA': {reflib: 'caption'},
	'CY': {reflib: 'address'},
	'DA': {reflib: 'date'},
	'DB': {reflib: 'database'},
	'DO': {reflib: 'doi'},
	'DP': {reflib: 'databaseProvider'},
	'EP': {reflib: 'endPage'},
	'ET': {reflib: 'edition'},
	'IS': {reflib: 'number'},
	'J1': {reflib: 'journal'},
	'JF': {reflib: 'journal'},
	'KW': {reflib: 'keywords', isArray: true},
	'LA': {reflib: 'language'},
	'N1': {reflib: 'notes'},
	'N2': {reflib: 'abstract'},
	'SN': {reflib: 'isbn'},
	'SP': {reflib: 'startPage'},
	'T1': {reflib: 'title'},
	'TI': {reflib: 'title'},
	'TY': {reflib: 'type'},
	'VL': {reflib: 'volume'},
	'Y1': {reflib: 'date'},
};

var _fieldTranslationsReverse = Object.fromEntries(
	Object.entries(_fieldTranslations) // Calculate the key/val lookup - this time with the key being the reflib key
		.map(([key, props]) => [props.reflib, {...props, ris: key}])
);

// Lookup object of RIS => RefLib types
var _typeTranslations = {
	// Place high-priority translations at the top (when we translate BACK we need to know which of multiple keys to prioritize)
	'ADVS': 'audiovisualMaterial',
	'JOUR': 'journalArticle',
	'PCOMM': 'personalCommunication',
	'VIDEO': 'filmOrBroadcast',

	// Low priority below this line
	'ABST': 'unknown',
	'AGGR': 'aggregatedDatabase',
	'ANCIENT': 'ancientText',
	'ART': 'artwork',
	'BILL': 'bill',
	'BLOG': 'blog',
	'BOOK': 'book',
	'CASE': 'case',
	'CHAP': 'bookSection',
	'CHART': 'chartOrTable',
	'CLSWK': 'classicalWork',
	'COMP': 'computerProgram',
	'CONF': 'conferenceProceedings',
	'CPAPER': 'conferencePaper',
	'CTLG': 'catalog',
	'DATA': 'dataset',
	'DBASE': 'onlineDatabase',
	'DICT': 'dictionary',
	'EBOOK': 'electronicBook',
	'ECHAP': 'electronicBookSection',
	'EDBOOK': 'editedBook',
	'EJOUR': 'electronicArticle',
	'ELEC': 'web',
	'ENCYC': 'encyclopedia',
	'EQUA': 'equation',
	'FIGURE': 'figure',
	'GEN': 'generic',
	'GOVDOC': 'governmentDocument',
	'GRANT': 'grant',
	'HEARING': 'hearing',
	'ICOMM': 'personalCommunication',
	'INPR': 'newspaperArticle',
	'JFULL': 'journalArticle',
	'LEGAL': 'legalRuleOrRegulation',
	'MANSCPT': 'manuscript',
	'MAP': 'map',
	'MGZN': 'magazineArticle',
	'MPCT': 'filmOrBroadcast',
	'MULTI': 'onlineMultimedia',
	'MUSIC': 'music',
	'NEWS': 'newspaperArticle',
	'PAMP': 'pamphlet',
	'PAT': 'patent',
	'RPRT': 'report',
	'SER': 'serial',
	'SLIDE': 'audiovisualMaterial',
	'SOUND': 'audiovisualMaterial',
	'STAND': 'standard',
	'STAT': 'statute',
	'THES': 'thesis',
	'UNPB': 'unpublished',
};

var _typeTranslationsReverse = Object.fromEntries(
	Object.entries(_typeTranslations)
		.map(([key, val]) => [val, key])
)


var config = {
	endMatcher: /^ER\s+?-/,
	fieldMatcher: /^([A-Z0-9]{2}\s+?)- (.*)$/,
	outputFieldPadding: 4,
	outputField: field => field.padEnd(4, ' '),
};

function parse(content) {
	var emitter = new events.EventEmitter();

	var parser = function(content) { // Perform parser in async so the function will return the emitter otherwise an error could be thrown before the emitter is ready
		var ref = {};
		var refField; // Currently appending ref field
		content.split(/\n/).forEach(function(line) {
			if (config.endMatcher.test(line)) { // Start of new reference
				if (ref) {
					// Final reference cleanup {{{
					// Pages {{{
					if (ref.startPage || ref.endPage) {
						ref.pages = (ref.startPage && ref.endPage) ? ref.startPage + '-' + ref.endPage
							: (ref.startPage) ? ref.startPage
							: '?';
						delete ref.startPage;
						delete ref.endPage;
					}
					// }}}
					// Type {{{
					ref.type = ref.type && _typeTranslations[ref.type] ? _typeTranslations[ref.type] : 'unknown';
					// }}}
					// }}}
					Object.keys(ref).forEach(k => {
						if (typeof ref[k] == 'string')
							ref[k] = ref[k].trimEnd()
					});

					emitter.emit('ref', ref);
					ref = {};
					refField = undefined;
				}
			} else {
				var bits = config.fieldMatcher.exec(line.trimEnd());
				if (bits) {
					bits[1] = bits[1].trimEnd(); // Remove suffix spaces
					if (_fieldTranslations[bits[1]]) { // Only accept known fields
						refField = _fieldTranslations[bits[1]];
						if (refField.isArray) {
							if (!ref[refField.reflib]) ref[refField.reflib] = [];

							if (refField.split) {
								bits[2].split(/\s*,\s*/).forEach(function(i) { ref[refField.reflib].push(i) });
							} else {
								ref[refField.reflib].push(bits[2]);
							}
						} else {
							ref[refField.reflib] = bits[2];
						}
					} else {
						refField = null;
					}
				} else if (refField) {
					if (Array.isArray(ref[refField.reflib])) {
						ref[refField.reflib].push(line);
					} else {
						ref[refField.reflib] += '\n' + line;
					}
				}
			}
		});
		emitter.emit('end');
	};

	if (typeof content == 'string') {
		setTimeout(function() { parser(content) });
	} else if (Buffer.isBuffer(content)) {
		setTimeout(function() { parser(content.toString('utf-8')) });
	} else if (content instanceof stream.Stream) {
		var buffer = '';
		content
			.on('data', function(data) {
				buffer += data.toString('utf-8');
			})
			.on('end', function() {
				parser(buffer);
			});
	} else {
		throw new Error('Unknown item type to parse: ' + typeof content);
	}

	return emitter;
};

function _pusher(stream, isLast, child, settings) {
	var buffer = config.outputField('TY') + '- ' + _typeTranslationsReverse[child.type || settings.defaultType] + '\n';
	delete child.type;

	if (child.pages) {
		var pages = child.pages.split(/-{1,2}/);
		child.startPage = pages[0];
		child.endPage = pages[1];
		delete child.pages
	}

	buffer += Object.entries(child)
		.map(([key, value]) => ({key, value}))
		.filter(field => !! _fieldTranslationsReverse[field.key]) // We know the key type?
		.map(field => Array.isArray(field.value) ? field.value.map(v => ({key: field.key, value: v})) : field) // Expand array type values
		.flat()
		.map(field => config.outputField(_fieldTranslationsReverse[field.key].ris) + '- ' + field.value)
		.join('\n');
	buffer += '\nER  - \n';

	stream.write(buffer.trimEnd(buffer) + (!isLast ? '\n' : ''));
};

function output(options) {
	var settings = {
		stream: null,
		defaultType: 'journalArticle', // Assume this reference type if we are not provided with one
		content: [],
		...options,
	};

	if (!settings.content) return next('No content has been provided');

	new Promise(resolve => {
		if (typeof settings.content == 'function') { // Callback
			var batchNo = 0;
			var fetcher = function() {
				settings.content(function(err, data, isLast) {
					if (err) return emitter.error(err);
					if (Array.isArray(data) && data.length > 0) { // Callback provided array
						data.forEach(function(d, dIndex) {
							_pusher(settings.stream, isLast && dIndex == data.length-1, d, settings);
						});
						setTimeout(fetcher);
					} else if(!Array.isArray(data) && typeof data == 'object') { // Callback provided single ref
						_pusher(settings.stream, isLast, data, settings);
						setTimeout(fetcher);
					} else { // End of stream
						resolve();
					}
				}, batchNo++);
			};
			fetcher();
		} else if (Array.isArray(settings.content)) { // Array of refs
			settings.content.forEach(function(d, dIndex) {
				_pusher(settings.stream, dIndex == settings.content.length -1, d, settings);
			});
			resolve();
		} else if (Array.isObject(settings.content)) { // Single ref
			_pusher(settings.stream, true, data, settings);
			resolve();
		}
	})
		.then(()=> settings.stream.end());

	return settings.stream;
}

module.exports = {
	output: output,
	parse: parse,
};
