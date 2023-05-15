// ==UserScript==
// @name         Wiki: Cytuj OpenLibrary
// @namespace    pl.enux.wiki
// @version      1.1.1
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
			ol: this.json.key.replace('/books/OL', ''),
		};
		return quote;
	}

	/** Render data for pl.wiki */
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
			| strony = 
		}}`.replace(/\n\s+/g, ' ');
	}
	/** Render data for en.wiki. */
	renderEn(quote) {
		let author = this.flatArray(quote.authors, ', ');
		let publisher = this.firstArray(quote.publishers);
		let lang = this.firstArray(quote.lang);
		return `{{cite book
			|author=${author}
			|title=${quote.title}
			|publisher=${publisher}
			|date=${quote.date}
			|isbn=${quote.isbn}
			|lang=${lang}
			|ol=${quote.ol}
			|page=
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
		const langMap = {
			"ara": "ar",
			"bul": "bg",
			"zho": "zh",
			"hrv": "hr",
			"ces": "cs",
			"dan": "da",
			"nld": "nl",
			"eng": "en",
			"est": "et",
			"fin": "fi",
			"fra": "fr",
			"deu": "de",
			"ell": "el",
			"hin": "hi",
			"hun": "hu",
			"ita": "it",
			"jpn": "ja",
			"lav": "lv",
			"lit": "lt",
			"nor": "no",
			"pol": "pl",
			"por": "pt",
			"ron": "ro",
			"rus": "ru",
			"srp": "sr",
			"slk": "sk",
			"slv": "sl",
			"spa": "es",
			"swe": "sv",
			"ukr": "uk"
		};
		if (Array.isArray(this.json.languages) && this.json.languages.length) {
			return this.json.languages.map(l=>l.key.replace('/languages/', '')).map(k=>{
				if (k in langMap) {
					return langMap[k];
				}
				console.warn('[CytujOpenLibrary]', 'Unknown language:', k);
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
		/** cache */
		this.quote = null;
	}

	/**
	 * Get Polish.
	 * @param {Function} callback 
	 */
	getText(lang, callback) {
		let render = (quote)=>this.q.renderPl(quote);
		if (lang === 'en') {
			render = (quote)=>this.q.renderEn(quote);
		}

		// don't load 2nd time (assumes the descriptions don't change dynamically)
		if (this.quote && typeof this.quote === 'object') {
			callback(render(this.quote));
			return;
		}
		this.q.load().then((quote)=>{
			//console.log('[QuoteActions]', 'data:', quote);
			this.quote = quote;
			callback(render(quote));
		});
	}

	/** Add styles. */
	addStyles() {
		if (this._stylesDone) {
			return;
		}
		this._stylesDone = true;
		document.body.insertAdjacentHTML('afterbegin', `<style>
		dialog.wikiquote::backdrop {
			background-color: rgba(0, 0, 0, 0.37);
			backdrop-filter: blur(1.0px);
		}
		dialog.wikiquote {
			border: 1px solid black;
			border-radius: .5em;

			opacity: 0;
		}
		dialog.wikiquote[open] {
			animation: wikiFadeIn .3s ease normal;
			opacity: 1;
		}
		@keyframes wikiFadeIn{
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		</style>`)
	}

	/** Open with quote text. */
	openDialog(text, tplLang) {
		let id = 'nux-quote-dialog';

		// delete previous
		let previous = document.getElementById(id);
		if (previous) {
			previous.remove();
		} else {
			this.addStyles();
		}

		let dialog = document.createElement('dialog');
		dialog.id = id;
		dialog.className = 'wikiquote';
		dialog.style.cssText = `width: 30em;`;
		dialog.innerHTML = `
			<h2 style="font-size: 110%;padding: 0;margin: 0;">Cytat dla ${tplLang==='pl' ? 'Polskiej' : 'Angielskiej'} Wikipedii</h2>
			<form>
				<p>Ten kod możesz skopiować zarówno do zwykłego edytora kodu jak i edytora wizualnego
				${tplLang==='pl'?' (najlepiej przed kropką kończącą zdanie)' : ''}.</p>
				<textarea style="width: 100%;box-sizing: border-box;height: 7em;"></textarea>
				<p>Pamiętaj, żeby podać numer strony (lub zakres stron) które chesz zacytować. 
				Możesz też podać Tytuł rozdziału (parametr „${tplLang==='pl' ? 'rozdział' : 'chapter'}”).
				To ważne w wypadku przypisów, żeby odnosić się do konkretnej treści.
				<div style="display: flex;gap: .5em;justify-content: flex-end;">
					<button class="copy">Kopiuj 📋</a>
					<button class="dialog-ok" value="default">Zamknij</button>
				</div>
			</form>
		`;
		const dataField = dialog.querySelector('textarea');
		dataField.value = `<ref>${text}</ref>`;
		dataField.addEventListener('click', function() {
			this.select();
			this.focus();
		});
		dialog.querySelector('.dialog-ok').addEventListener('click', (event) => {
			event.preventDefault();	// prevent submit
			dialog.close();
		});
		dialog.querySelector('.copy').addEventListener('click', (event) => {
			event.preventDefault();	// prevent submit
			this.copyTextField(dataField);
		});
		document.body.appendChild(dialog);
		dialog.showModal();
	}
	
	/**
	 * Copy text field contents.
	 * @param {Element|String} source Element or selector.
	 */
	copyTextField(source) {
		if (typeof source === 'string') {
			source = document.querySelector(source);
		}
		source.select();
		document.execCommand("copy");
	}
	/**
	 * Move cite tools container.
	 */
	reflowContainer(container) {
		const el = document.createElement('div');
		el.className = 'panel';
		const sub = document.createElement('div');
		sub.className = 'btn-notice';
		sub.style.cssText = 'display:flex';
		el.appendChild(sub);
		sub.appendChild(container);

		// should be in a sidebar in a visable
		const before = document.querySelector('#read').lastElementChild;
		before.parentNode.insertBefore(el, before);
	}

	/** Cite-dialog link-button. */
	createLink(container, options) {
		const el = document.createElement('a');
		el.textContent = options.text;
		el.title = options.title;
		el.href = 'javascript:;';
		el.onclick = () => {
			this.getText(options.lang, (text) => {
				this.openDialog(text, options.lang);
			})
		};

		container.appendChild(el);
		el.insertAdjacentHTML('beforebegin', '<br> 🌐 ');
	}

	/** Init when ready. */
	init() {
		const enQuote = document.querySelector('#wikilink');
		if (!enQuote) {
			return false;
		}

		// container
		const container = document.createElement('div');
		container.className = 'cta-section';
		container.insertAdjacentHTML('afterbegin', '<strong>Wikipedia</strong>:');

		// pl
		this.createLink(container, {
			lang: 'pl',
			text: 'Cytuj książkę (pl)',
			title: 'Zacytuj to na Polskiej Wikipedii',
		});
		// en
		this.createLink(container, {
			lang: 'en',
			text: 'Cite book (en)',
			title: 'Zacytuj to na Angielskiej Wikipedii',
		});

		// move container
		this.reflowContainer(container);
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

// TODO: remove previous on double-run?