//
// OpenLibrary API vs CORS
// Works from Wikipedia (allows CORS).
// Docs: https://openlibrary.org/dev/docs/api/books
var re = await fetch("https://openlibrary.org/isbn/9780140328721.json", {
	"credentials": "omit",
	"method": "GET",
	"mode": "cors"
});
var json = await re.json();
console.log(json);
// rdf doesn't work though 🤔...
/*
var re = await fetch("https://openlibrary.org/isbn/9780140328721.rdf", {
	"credentials": "omit",
	"method": "GET",
	"mode": "cors"
})
// you can get a redirect urls like so (though that RDF URL is blocked too):
url = re.url.replace('.json', '.rdf') 
*/
// you can get author info from API though
var authorKey = json.authors[0].key;
var author = await fetch('https://openlibrary.org/authors/OL34184A.json', {
	"credentials": "omit",
	"method": "GET",
	"mode": "cors"
})
.then(response => response.json())
;
console.log(author);

//
// Language mapping
https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
var la = `en,de,fr,es,it,ru,pt,nl,sv,da,no,pl,fi,el,cs,hu,ro,bg,sk,hr,sr,sl,uk,et,lv,lt,zh,hi,ar,ja`.split(',');
var tab = document.querySelectorAll('table.wikitable.sortable tr');
var langMap = {};
tab.forEach((tr)=>{
  const tds = tr.querySelectorAll('td');
  if (tds.length < 4) {
    return;
  }
  const l2 = tds[1].textContent;
  const l3 = tds[4].textContent.replace(/\s+\+.+/, '');
  if (la.indexOf(l2) >= 0) {
    console.log({l3:l2});
    langMap[l3] = l2;
  }
})
console.log(langMap);
copy(langMap);

//
// re-flow history
//document.querySelector('#header-bar').appendChild(historyTools);
//contentBody.prepend(historyTools);
var el = document.createElement('div');
el.className = 'panel';
var sub = document.createElement('div');
sub.className = 'btn-notice';
sub.style.cssText = 'display:flex';
el.appendChild(sub);
sub.appendChild(historyTools);

var before = document.querySelector('.panel').nextElementSibling;
before.parentNode.insertBefore(el, before);
