// ==UserScript==
// @name         Wiki: Cytuj OpenLibrary
// @namespace    pl.enux.wiki
// @version      0.0.1
// @description  Polskie cytowanie książek na podstawie OpenLibrary.
// @author       Nux
// @match        https://openlibrary.org/books/*
// @grant        none
// @updateURL    https://github.com/Eccenux/wiki-CytujOpenLibrary/raw/master/CytujOpenLibrary.meta.js
// @downloadURL  https://github.com/Eccenux/wiki-CytujOpenLibrary/raw/master/CytujOpenLibrary.user.js
// ==/UserScript==

// fetch
var CytujOpenLibrary = class {
	async load() {
		this.rdf = await cytuj.loadCurrentRdf();
		this.json = await cytuj.loadCurrentJson();
		let quote = {
			authors: this.readAuthors(),
			title: this.json.title,
			isbn: this.readIsbn(),
			publishers: this.json.publishers,
			date: this.json.publish_date,
			lang: this.readLangs(),
		};
		console.log(quote);
		return quote;
	}

	renderPl(quote) {
		let author = this.flatArray(quote.authors, ', ');
		let publisher = this.firstArray(quote.publishers);
		let lang = this.firstArray(quote.lang);
		return `{{Cytuj książkę
			| autor = ${author}
			| tytuł = ${quote.title}
			| wydawca = ${publisher}
			| data = ${quote.date}
			| isbn = ${quote.isbn}
			| język = ${lang}
		}}`.replace(/\n\s+/g, ' ');
	}

	/** Load RDF XML as a promise. */
	loadCurrentRdf() {
		let url = document.querySelector('#historyTools a[href$=rdf]').href;
		return fetch(url)
			.then(response => response.text())
			.then(str => ((new DOMParser()).parseFromString(str, 'text/xml')))
	}
	/** Load JSON based object as a promise. */
	loadCurrentJson() {
		let url = document.querySelector('#historyTools a[href$=json]').href;
		return fetch(url)
			.then(response => response.json())
	}
	/** Read authors as an array. */
	readAuthors() {
		const authorList = this.rdf.getElementsByTagName("bibo:authorList")[0];
		if (authorList) {
			const authorNames = authorList.getElementsByTagName("foaf:name");
			return [...authorNames].map(el=>el.textContent);
		}
		return [];
	}
	/** Read ISBN 13 with 10 fallback. */
	readIsbn() {
		let isbn = '';
		if (Array.isArray(this.json.isbn_13)) {
			isbn = this.firstArray(this.json.isbn_13);
		} else if (Array.isArray(this.json.isbn_10)) {
			isbn = this.firstArray(this.json.isbn_10);
		} else if (Array.isArray(this.json.isbn)) {
			isbn = this.firstArray(this.json.isbn);
		}
		return isbn;
	}
	/** Read langs as an array. */
	readLangs() {
		if (Array.isArray(this.json.languages) && this.json.languages.length) {
			return this.json.languages.map(l=>l.key.replace('/languages/', '')).map(k=>{
				if (k === 'eng') {
					return 'en';
				}
				return k;
			});
		}
		return [];
	}
	/** Safely flatten the array. */
	flatArray(arr, separator) {
		if (!Array.isArray(arr) || !arr.length) {
			return '';
		}
		return arr.join(separator);
	}
	/** Safe 1st. */
	firstArray(arr) {
		if (!Array.isArray(arr) || !arr.length) {
			return '';
		}
		return arr[0];
	}
}

var cytuj = new CytujOpenLibrary();
cytuj.load().then((quote)=>{
	console.log(cytuj.renderPl(quote))
});