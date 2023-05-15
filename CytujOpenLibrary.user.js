﻿// ==UserScript==
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

/**
 * Fetch & render.
 */
var CytujOpenLibrary = class {
	/** Fetch (main). */
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

	/** Render loaded for pl. */
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

	/** @private Load RDF XML as a promise. */
	loadCurrentRdf() {
		let url = document.querySelector('#historyTools a[href$=rdf]').href;
		return fetch(url)
			.then(response => response.text())
			.then(str => ((new DOMParser()).parseFromString(str, 'text/xml')))
	}
	/** @private Load JSON based object as a promise. */
	loadCurrentJson() {
		let url = document.querySelector('#historyTools a[href$=json]').href;
		return fetch(url)
			.then(response => response.json())
	}
	/** @private Read authors as an array. */
	readAuthors() {
		const authorList = this.rdf.getElementsByTagName("bibo:authorList")[0];
		if (authorList) {
			const authorNames = authorList.getElementsByTagName("foaf:name");
			return [...authorNames].map(el=>el.textContent);
		}
		return [];
	}
	/** @private Read ISBN 13 with 10 fallback. */
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
	/** @private Read langs as an array. */
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
	/** @private Safely flatten the array. */
	flatArray(arr, separator) {
		if (!Array.isArray(arr) || !arr.length) {
			return '';
		}
		return arr.join(separator);
	}
	/** @private Safe 1st. */
	firstArray(arr) {
		if (!Array.isArray(arr) || !arr.length) {
			return '';
		}
		return arr[0];
	}
}

/**
 * Quote actions (buttons).
 */
var QuoteActions = class {
	/**
	 * cons.
	 * @param {CytujOpenLibrary} cytuj 
	 */
	constructor(cytuj) {
		this.q = cytuj;
	}

	/**
	 * Get Polish.
	 * @param {Function} callback 
	 */
	getPl(callback) {
		// TODO: add cashing? (don't load 2nd time?)
		this.q.load().then((quote)=>{
			console.log(this.q.renderPl(quote));
			callback(this.q.renderPl(quote));
		});
	}

	/** Open with quote text. */
	openDialog(text) {
		let dialog = document.createElement('dialog');
		dialog.innerHTML = `
		  <form>
			<p>
			  <textarea></textarea>
			</p>
			<div>
			  <button class="dialog-ok" value="default">OK</button>
			</div>
		  </form>
		`;
		dialog.querySelector('textarea').value = text;
		dialog.querySelector('.dialog-ok').addEventListener('click', (event) => {
			event.preventDefault();	// prevent submit
			dialog.close();
		});
		document.body.appendChild(dialog);
		dialog.showModal();
	}

	/** Init when ready. */
	init() {
		// fix current
		const enQuote = document.querySelector('#wikilink');
		if (!enQuote) {
			return false;
		}
		enQuote.textContent = 'cite book (en.wikipedia)';
		enQuote.title = 'Zacytuj to na Angielskiej Wikipedii';
		
		const container = document.querySelector('#historyTools');
		// append pl
		const el = document.createElement('a');
		el.textContent = 'Cytuj książkę (pl.wikipedia)';
		el.title = 'Zacytuj to na Polskiej Wikipedii';
		el.href = 'javascript:;';
		el.onclick = () => {
			this.getPl((text) => {
				this.openDialog(text);
			})
		};
		container.appendChild(document.createTextNode('•'));
		container.appendChild(el);
	}

	/** Check if the page is ready. */
	checkReady() {
		return document.readyState === "complete" || document.readyState === "interactive";
	}

	/** Run any time to init actions on the page. */
	safeInit() {
		if (this.checkReady()) {
			this.init();
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				this.init();
			});
		}
	}
}

var cytuj = new CytujOpenLibrary();
var qactions = new QuoteActions(cytuj);
qactions.safeInit();

// TODO: dialog layout
// TODO: getPl caching
// TODO: focus
// TODO: remove previous on double-run?