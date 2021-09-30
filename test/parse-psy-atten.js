var _ = require('lodash');
var expect = require('chai').expect;
var fs = require('fs');
var rl = require('../index');

describe('RIS parser - test #1', function() {
	var resErr;
	var data = [];

	before(function(next) {
		this.timeout(60 * 1000);
		rl.parse(fs.readFileSync(__dirname + '/data/psy-atten.ris', 'utf-8'))
			.on('error', function(err) {
				resErr = err;
				next();
			})
			.on('ref', function(ref) {
				data.push(ref);
			})
			.on('end', next);
	});

	it('should not raise an error', function() {
		expect(resErr).to.be.not.ok;
	});

	it('end count should be accurate', function() {
		expect(data).to.have.length(492);
	});

	it('should return random sample (Using resting state functional connectivity to unravel networks of tinnitus)', function() {
		var sample = data['97'];
		expect(sample).to.be.ok;
		expect(sample).to.have.property('title', 'Using resting state functional connectivity to unravel networks of tinnitus.');
		expect(sample).to.have.property('type', 'web');
		expect(sample).to.have.property('journal', 'Hearing Research');
		expect(sample).to.have.property('authors');
		expect(sample.authors).to.have.length(103);
		expect(sample.authors[0]).to.equal('Husain, Fatima T');
		expect(sample.authors[1]).to.equal('Schmidt, Sara A');
		expect(sample.authors[2]).to.equal('Adamchic');
		expect(sample.authors[3]).to.equal('Agosta');
		expect(sample).to.have.property('date', '2014//');
		expect(sample).to.have.property('pages', '153-162');
		expect(sample).to.have.property('address', 'Husain, Fatima T.: husainf@illinois.edu');
		expect(sample).to.have.property('isbn', '0378-5955');
		expect(sample).to.have.property('abstract');
		expect(sample.abstract).to.match(/^Resting state functional connectivity/);
		expect(sample.abstract).to.match(/defined as the perception/);
		expect(sample.abstract).to.match(/PsycINFO Database Record/);
		expect(sample.keywords).to.deep.equal(['*Tinnitus', '*Functional Magnetic Resonance Imaging', 'Behavioral Assessment', 'Brain', 'Hearing Disorders', 'Schizophrenia']);
	});

	it('should return random sample (The need for research in the education of the deaf and hard-of-hearing.)', function() {
		var sample = data[data.length - 1]; // Last record
		expect(sample).to.be.ok;
		expect(sample).to.have.property('title', 'The need for research in the education of the deaf and hard-of-hearing.');
		expect(sample).to.have.property('type', 'web');
		expect(sample).to.have.property('pages', '33');
	});
});
