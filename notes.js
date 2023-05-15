// works from Wikipedia
var re = await fetch("https://openlibrary.org/books/OL34043239M.json", {
    "credentials": "omit",
    "method": "GET",
    "mode": "cors"
});
var json = await re.json();
console.log(json);

// how to get OL34043239M from ISBN?
// covers work with ISBN.
// https://covers.openlibrary.org/b/isbn/9788375760040-M.jpg?default=false


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
