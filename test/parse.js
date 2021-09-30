var expect = require('chai').expect;
var rl = require('../index');

// Issues reported in https://github.com/hash-bang/reflib-ris/issues/2
describe('RIS parsing', function() {

	it('should parse references with invalid fields #1 - all valid fields', done => {
		var data =
			'TY  - JOUR\n' +
			'TI  - Test article 1.\n' +
			'DO  - https://dx.doi.org/10.1024/1422-4917/a000447\n' +
			'ER  - \n' +
			'\n' +
			'TY  - BOOK\n' +
			'TI  - Test article 2\n' +
			'AB  - Altered cognitive control and threat processing mediates the relationship between anxiety symptoms and reading problems in children\n' +
			'L1  - https://pdf\n' +
			'L2  - https://fulltext\n' +
			'L3  - https://related\n' +
			'L4  - https://images\n' +
			'UR  - https://url\n' +
			'ER  - \n';

		var refs = [];
		rl.parse(data)
			.on('ref', ref => refs.push(ref))
			.on('end', ()=> {
				expect(refs).to.deep.equal([
					{
						"doi": "https://dx.doi.org/10.1024/1422-4917/a000447",
						"title": "Test article 1.",
						"type": "journalArticle",
					},
					{
						"abstract": "Altered cognitive control and threat processing mediates the relationship between anxiety symptoms and reading problems in children",
						"title": "Test article 2",
						"type": "book",
						"urls": [
							'https://pdf',
							'https://fulltext',
							'https://related',
							'https://images',
							'https://url',
						],
					},
				]);
				done();
			});
	});

	it('should parse references with invalid fields #2 - invalid field before end', done => {
		var data =
			'TY  - JOUR\n' +
			'TI  - Test article 1.\n' +
			'DO  - https://dx.doi.org/10.1024/1422-4917/a000447\n' +
			'ID  - 2918\n' +
			'ER  - \n' +
			'\n' +
			'TY  - JOUR\n' +
			'TI  - Test article 2\n' +
			'AB  - Altered cognitive control and threat processing mediates the relationship between anxiety symptoms and reading problems in children\n' +
			'ID  - 2919\n' +
			'ER  - \n';

		var refs = [];
		rl.parse(data)
			.on('ref', ref => refs.push(ref))
			.on('end', ()=> {
				expect(refs).to.deep.equal([
					{
						"doi": "https://dx.doi.org/10.1024/1422-4917/a000447",
						"title": "Test article 1.",
						"type": "journalArticle",
					},
					{
						"abstract": "Altered cognitive control and threat processing mediates the relationship between anxiety symptoms and reading problems in children",
						"title": "Test article 2",
						"type": "journalArticle",
					},
				]);
				done();
			});
	});

});
