var _ = require('lodash');
var expect = require('chai').expect;
var fs = require('fs');
var rl = require('../index');

describe('RIS parser - misc data examples', function() {
	var resErr;
	var data = [];

	before(function(next) {
		this.timeout(60 * 1000);
		rl.parse(fs.readFileSync(__dirname + '/data/misc.ris', 'utf-8'))
			.on('error', function(err) {
				resErr = err;
				next();
			})
			.on('ref', function(ref) {
				data.push(ref);
			})
			.on('end', next);
	});

	it('should have parsed the data correctly', function() {
		expect(data).to.have.length(1);

		expect(data[0]).to.have.property('type', 'book');
		expect(data[0]).to.have.property('abstract');
		expect(data[0].abstract).to.match(/^Now early childhood.+all rights reserved\)$/);
		expect(data[0]).to.have.property('authors');
		// FIXME: AN
		expect(data[0].authors).to.deep.equal([
			'Barrueco, Sandra',
			'López, Michael',
			'Ong, Christine',
			'Lozano, Patricia',
		]);
		expect(data[0]).to.have.property('address', 'Baltimore, MD');
		expect(data[0]).to.have.property('database', 'psyh');
		expect(data[0]).to.have.property('databaseProvider', 'EBSCOhost');
		expect(data[0]).to.have.property('keywords');
		expect(data[0].keywords).to.deep.equal([
			'early childhood development',
			'preschool children',
			'Spanish-English bilingualism',
			'bilingualism',
			'assessment',
			'linguistic assessment',
			'developmental assessment',
			'test versions',
			'test administration',
			'test scoring',
			'test standardization',
			'norming',
			'validity',
			'reliability',
			'adaptations',
			'accommodations',
			'Developmental Measures',
			'Language Development',
			'Testing',
			'Accommodation (Disabilities)',
			'Educational Measurement',
			'Foreign Language Translation',
			'Linguistics',
			'Preschool Students',
			'Scoring (Testing)',
			'Test Forms',
			'Test Reliability',
			'Test Validity',
		]);
		expect(data[0]).to.have.property('notes');
		expect(data[0].abstract).to.match(/^Now early childhood.+ 2016 APA, all rights reserved\)$/);
		expect(data[0]).to.have.property('publisher', 'Paul H Brookes Publishing');
		expect(data[0]).to.have.property('year', '2012');
		expect(data[0]).to.have.property('isbn', '1-59857-219-9\n978-1-59857-219-3');
		expect(data[0]).to.have.property('title', 'Assessing Spanish-English bilingual preschoolers: A guide to best approaches and measures');
		expect(data[0]).to.have.property('title', 'Assessing Spanish-English bilingual preschoolers: A guide to best approaches and measures');

		expect(data[0]).to.have.property('urls');
		expect(data[0].urls).to.deep.equal([
			'http://search.ebscohost.com/login.aspx?direct=true&AuthType=ip,url,cookie,uid&db=psyh&AN=2012-08253-000&site=ehost-live&scope=site',
		]);
	});
});
