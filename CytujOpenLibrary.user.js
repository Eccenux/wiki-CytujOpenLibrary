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
	async load() {
		this.rdf = await cytuj.loadCurrentRdf();
		this.json = await cytuj.loadCurrentJson();
    console.log(this.json)
	}
	readAuthors() {
		const authorList = xmlDoc.getElementsByTagName("bibo:authorList")[0];
		const authorNames = authorList.getElementsByTagName("foaf:name");
		// Wyświetlenie imion autorów
		for (let i = 0; i < authorNames.length; i++) {
			console.log(authorNames[i].textContent);
		}
	}
}

var cytuj = new CytujOpenLibrary();
cytuj.load();
