/* The Office display deliberately uses ES5 + XHR so Office 2016 does not load the React application. */
(function () {
  'use strict';
  var api = document.documentElement.getAttribute('data-api'), current = null, credential = null, gameKey = '', stopped = false, timer = null, generation = 0, signature = '';
  var replay = /(?:^|&)run=([a-f0-9-]{36})(?:&|$)/i.exec(window.location.hash.slice(1));
  // Slides default to Vietnamese regardless of the Office/browser language.
  // Keep English available through an explicit ?lang=en display URL.
  var en = /(?:^|[?&])lang=en(?:&|$)/i.test(window.location.search);
  document.documentElement.lang = en ? 'en' : 'vi';
  function text(vi, english) { return en ? english : vi; }
  function el(id) { return document.getElementById(id); }
  function error(message) { el('error').textContent = message || ''; el('error').style.display = message ? 'block' : 'none'; }
  function request(method, path, body, done) {
    var xhr = new XMLHttpRequest(); xhr.open(method, api + path, true); xhr.timeout = 15000;
    if (body) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () { var value; try { value = JSON.parse(xhr.responseText); } catch (ignore) { return done(new Error(text('Phản hồi không hợp lệ.', 'Invalid response.'))); }
      if (xhr.status < 200 || xhr.status >= 300 || value.success === false) { var fail = new Error((value.error && (value.error.message || value.error)) || value.message || 'HTTP ' + xhr.status); fail.status = xhr.status; return done(fail); }
      done(null, value.success === true ? value.data : value);
    };
    xhr.onerror = xhr.ontimeout = function () { done(new Error(text('Mất kết nối. Đang thử lại…', 'Connection lost. Retrying…'))); };
    xhr.send(body ? JSON.stringify(body) : null);
  }
  function storageKey() { return 'quizzz.card-display.' + gameKey + (replay ? '.' + replay[1] : ''); }
  function remember(value) { credential = value; try { localStorage.setItem(storageKey(), JSON.stringify(value)); } catch (ignore) {} }
  function loadSaved() { try { return JSON.parse(localStorage.getItem(storageKey())); } catch (ignore) { return null; } }
  function begin() {
    generation++; signature = ''; window.clearTimeout(timer); stopped = false; credential = loadSaved();
    el('setup').style.display = 'none'; el('display').style.display = 'flex';
    if (credential && credential.id && credential.displayToken) poll(); else fresh();
  }
  function fresh() {
    var activeGeneration = generation;
    request('POST', '/card-games/presentations/' + gameKey + '/displays', {}, function (failure, value) {
      if (stopped || activeGeneration !== generation) return;
      if (failure) { error(failure.message); timer = window.setTimeout(fresh, 5000); return; }
      remember(value); poll();
    });
  }
  function poll() {
    if (stopped || !credential) return;
    if (document.hidden) { timer = window.setTimeout(poll, 1500); return; }
    var activeGeneration = generation;
    request('GET', '/card-games/displays/' + credential.id + '?token=' + encodeURIComponent(credential.displayToken), null, function (failure, value) {
      if (stopped || activeGeneration !== generation) return;
      if (failure) { if (failure.status === 410 || failure.status === 403) { remember(null); fresh(); return; } error(failure.message); }
      else { error(''); current = value; var stable = JSON.parse(JSON.stringify(value)); if (stable.session) delete stable.session.timeRemaining; var nextSignature = JSON.stringify(stable); if (signature !== nextSignature) { signature = nextSignature; render(value); } }
      timer = window.setTimeout(poll, failure ? 3000 : 900);
    });
  }
  function span(className, value) { var element = document.createElement('span'); element.className = className; element.textContent = value; return element; }
  var medals = ['🥇', '🥈', '🥉'];
  function renderPodium(players) {
    var podium = el('podium'), empty = el('celebration-empty');
    podium.innerHTML = '';
    empty.hidden = players.length > 0;
    empty.textContent = text('Chưa có học sinh trong bảng xếp hạng.', 'No students on the leaderboard yet.');
    for (var index = 0; index < Math.min(3, players.length); index++) {
      var player = players[index], rank = index + 1, score = Number(player.score) || 0;
      var place = document.createElement('li'), medal = span('podium-medal', medals[index]);
      place.className = 'podium-place podium-' + rank;
      medal.setAttribute('aria-hidden', 'true');
      place.appendChild(medal);
      place.appendChild(span('podium-rank', text('Hạng ', 'Rank ') + rank));
      place.appendChild(span('podium-name', player.nickname));
      place.appendChild(span('podium-score', score + text(' điểm', score === 1 ? ' point' : ' points')));
      var step = span('podium-step', String(rank));
      step.setAttribute('aria-hidden', 'true');
      place.appendChild(step);
      podium.appendChild(place);
    }
  }

  var answerLetters = ['A', 'B', 'C', 'D'];
  var nameOrder = window.Intl && Intl.Collator ? new Intl.Collator('vi', { sensitivity: 'base' }) : null;
  function compareNames(left, right) { return nameOrder ? nameOrder.compare(left, right) : left.localeCompare(right); }

  function renderStudentResults(players, correctAnswer) {
    var list = el('student-results'), names = Object.create(null);
    players.forEach(function (player) { names[player.nickname] = true; });
    var entries = players.map(function (player) {
      var fullName = String(player.nickname || '').trim();
      // The roster may append a number to distinguish duplicate full names.
      var baseName = fullName.replace(/\s+\d+$/, '');
      var words = (names[baseName] ? baseName : fullName).split(/\s+/);
      return { fullName: fullName, name: words[words.length - 1], player: player };
    });
    entries.sort(function (left, right) {
      return compareNames(left.name, right.name) || compareNames(left.fullName, right.fullName) || left.player.markerId - right.player.markerId;
    });
    list.innerHTML = '';
    entries.forEach(function (entry) {
      var answer = entry.player.answer;
      var answered = answerLetters.indexOf(answer) !== -1;
      var correct = answered && answer === correctAnswer;
      var status = !answered ? text('Chưa trả lời', 'No answer') : correct ? text('Đúng', 'Correct') : text('Sai', 'Incorrect');
      var card = document.createElement('li');
      card.className = 'student-result ' + (!answered ? 'unanswered' : correct ? 'correct' : 'incorrect');
      card.title = entry.fullName;
      card.setAttribute('aria-label', entry.fullName + ', ' + (answered ? answer + ', ' : '') + status);
      card.appendChild(span('student-result-name', entry.name));
      card.appendChild(span('student-result-answer', answered ? answer : '—'));
      list.appendChild(card);
    });
  }

  function renderQuestionResults(session) {
    var summary = session.questionSummary, chart = el('answer-chart');
    var roster = el('student-results-scroll'), questionKey = session.id + '/' + session.currentQuestion;
    var sameQuestion = roster.getAttribute('data-question') === questionKey;
    var scrollTop = sameQuestion ? roster.scrollTop : 0;
    var counts = answerLetters.map(function (letter) { return Number(summary.counts[letter]) || 0; });
    var answered = counts.reduce(function (total, count) { return total + count; }, 0);
    var highest = Math.max.apply(null, counts) || 1;
    el('correct-choice').textContent = text('Đáp án đúng ', 'Correct answer ') + summary.correctAnswer;
    el('review-totals').textContent = answered + '/' + session.players.length + text(' học sinh đã trả lời', ' students answered');
    chart.innerHTML = '';
    answerLetters.forEach(function (letter, index) {
      var column = document.createElement('li'), track = document.createElement('div'), bar = document.createElement('div');
      column.className = 'answer-column' + (letter === summary.correctAnswer ? ' correct' : '');
      column.setAttribute('aria-label', letter + ': ' + counts[index] + (letter === summary.correctAnswer ? text(', đáp án đúng', ', correct answer') : ''));
      track.className = 'answer-track';
      bar.className = 'answer-bar';
      bar.style.height = counts[index] / highest * 100 + '%';
      bar.appendChild(span('answer-count', String(counts[index])));
      track.appendChild(bar);
      column.appendChild(track);
      column.appendChild(span('answer-letter', letter));
      chart.appendChild(column);
    });
    renderStudentResults(session.players, summary.correctAnswer);
    roster.setAttribute('data-question', questionKey);
    roster.scrollTop = scrollTop;
  }

  function render(value) {
    var session = value.session, waiting = !session || session.status === 'lobby', finished = session && session.status === 'finished';
    var reviewing = !waiting && !finished && session.questionStatus === 'closed' && session.questionSummary;
    var stage = el('stage'), newlyFinished = finished && stage.className !== 'is-finished';
    stage.className = finished ? 'is-finished' : reviewing ? 'is-reviewing' : '';
    el('new-display').textContent = finished ? text('Chơi lại', 'Play again') : text('Chuẩn bị lượt chơi mới', 'Prepare a new run');
    el('title').textContent = value.title; el('subtitle').textContent = value.className + (session && !waiting ? ' · ' + text('Câu ', 'Question ') + Math.min(session.currentQuestion + 1, session.questionCount) + ' / ' + session.questionCount : ' · ' + value.questionCount + text(' câu hỏi', ' questions'));
    el('notice').textContent = waiting ? value.paired ? text('Đã kết nối. Chờ bấm Bắt đầu trên điện thoại.', 'Connected. Waiting for Start on the phone.') : text('Chưa bắt đầu. Chờ điện thoại kết nối.', 'Not started. Waiting for the phone.') : finished ? text('Trò chơi đã kết thúc.', 'The game has ended.') : session.questionStatus === 'closed' ? text('Đã chốt câu. Giáo viên chủ động chuyển câu trên điện thoại.', 'Question ended. Continue from the phone when ready.') : '';
    el('waiting').style.display = waiting ? 'flex' : 'none'; stage.style.display = waiting ? 'none' : 'flex';
    if (waiting) { if (el('qr').src !== value.qr) el('qr').src = value.qr; el('pair-link').href = value.pairUrl; }
    if (!waiting && !reviewing) {
      var ranking = el('ranking'), rankingScroll = newlyFinished ? 0 : ranking.scrollTop;
      var players = session.players.slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0) || a.markerId - b.markerId; });
      ranking.innerHTML = '';
      for (var p = 0; p < players.length; p++) { var row = document.createElement('div'); row.className = 'rank-row'; row.appendChild(span('rank-number', medals[p] || String(p + 1))); row.appendChild(span('rank-name', players[p].nickname)); row.appendChild(span('rank-score', String(players[p].score || 0))); ranking.appendChild(row); }
      ranking.scrollTop = rankingScroll;
      if (finished) renderPodium(players);
    }
    if (reviewing) renderQuestionResults(session);
    if (!waiting && !finished && !reviewing) {
      var question = session.currentQuestionData;
      el('question').textContent = question ? question.question : '';
      el('options').innerHTML = ''; el('media').innerHTML = '';
      if (question) {
        media(question);
        for (var index = 0; index < question.options.length; index++) {
          var letter = answerLetters[index], box = document.createElement('div'); box.className = 'option';
          var badge = document.createElement('b'); badge.textContent = letter + '.'; box.appendChild(badge); box.appendChild(span('', question.options[index]));
          el('options').appendChild(box);
        }
      }
      el('question-panel').className = el('media').childNodes.length ? 'has-media' : '';
    }
    clock();
  }
  function safeImage(source) { return typeof source === 'string' && /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,|\/[^/])/i.test(source); }
  function media(question) {
    var geometry = question.geometry, source = question.imageUrl || (geometry && geometry.imageUrl);
    if (safeImage(source)) { var image = document.createElement('img'); image.src = source; image.alt = text('Hình minh họa', 'Question illustration'); el('media').appendChild(image); }
    if (!geometry || !geometry.elements || !geometry.elements.length) return;
    // Render only the saved declarative geometry whitelist; never evaluate element content.
    var bounds = geometry.boundingBox || [-5,5,5,-5], width = 560, height = 240, points = Object.create(null), ns = 'http://www.w3.org/2000/svg';
    if (bounds.length !== 4 || !bounds.every(function(n){return typeof n==='number' && isFinite(n);}) || bounds[0]>=bounds[2] || bounds[1]<=bounds[3]) bounds=[-5,5,5,-5];
    var scale = Math.min(width/(bounds[2]-bounds[0]), height/(bounds[1]-bounds[3])), offsetX=(width-(bounds[2]-bounds[0])*scale)/2, offsetY=(height-(bounds[1]-bounds[3])*scale)/2;
    var svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', text('Hình minh họa', 'Question illustration'));
    function x(value) { return offsetX+(value-bounds[0])*scale; } function y(value) { return offsetY+(bounds[1]-value)*scale; }
    function shape(name, attrs) { var item = document.createElementNS(ns, name), key; for (key in attrs) if (Object.prototype.hasOwnProperty.call(attrs,key)) item.setAttribute(key,attrs[key]); svg.appendChild(item); return item; }
    for (var i=0;i<geometry.elements.length;i++) { var point=geometry.elements[i]; if(point.type==='point'&&point.coords&&point.coords.length===2) points[point.id]=point.coords; }
    for (var j=0;j<geometry.elements.length;j++) {
      var part=geometry.elements[j], refs=part.points||[], a=points[refs[0]], b=points[refs[1]], center=points[part.center], coords=part.coords;
      if(part.type==='point'&&coords) { shape('circle',{cx:x(coords[0]),cy:y(coords[1]),r:3,fill:'#087fb7'}); if(part.label)shape('text',{x:x(coords[0])+6,y:y(coords[1])-6,'font-size':16}).textContent=part.label; }
      else if((part.type==='segment'||part.type==='line')&&a&&b)shape('line',{x1:x(a[0]),y1:y(a[1]),x2:x(b[0]),y2:y(b[1]),stroke:'#087fb7','stroke-width':2});
      else if(part.type==='polygon') { var values=[];for(var k=0;k<refs.length;k++)if(points[refs[k]])values.push(x(points[refs[k]][0])+','+y(points[refs[k]][1]));shape('polygon',{points:values.join(' '),fill:'#dff6ff',stroke:'#087fb7','stroke-width':2}); }
      else if(part.type==='circle'&&(center||a)&&typeof part.radius==='number') { center=center||a;shape('circle',{cx:x(center[0]),cy:y(center[1]),r:Math.abs(part.radius*scale),fill:'none',stroke:'#087fb7','stroke-width':2}); }
      else if(part.type==='angle'&&a&&b&&points[refs[2]]) { var c=points[refs[2]],first=Math.atan2(a[1]-b[1],a[0]-b[0]),last=Math.atan2(c[1]-b[1],c[0]-b[0]),delta=(last-first+Math.PI*2)%(Math.PI*2),radius=20;shape('path',{d:'M '+(x(b[0])+radius*Math.cos(first))+' '+(y(b[1])-radius*Math.sin(first))+' A '+radius+' '+radius+' 0 '+(delta>Math.PI?1:0)+' 0 '+(x(b[0])+radius*Math.cos(last))+' '+(y(b[1])-radius*Math.sin(last)),fill:'none',stroke:'#087fb7','stroke-width':2});if(part.label)shape('text',{x:x(b[0])+30*Math.cos(first+delta/2),y:y(b[1])-30*Math.sin(first+delta/2),'font-size':16}).textContent=part.label; }
      else if(part.type==='text'&&coords)shape('text',{x:x(coords[0]),y:y(coords[1]),'font-size':16}).textContent=String(part.text||'');
    }
    el('media').appendChild(svg);
  }
  function clock() {
    var session = current && current.session;
    if (!session || session.status !== 'playing') { el('clock').textContent = ''; return; }
    var remaining = session.questionStatus === 'closed' ? 0 : Math.max(0, Math.ceil((new Date(session.questionStartedAt).getTime() + session.timeLimitSeconds * 1000 - Date.now()) / 1000)); el('clock').textContent = remaining + 's';
  }
  function keyFrom(value) { var match = String(value || '').match(/(?:game=|^)([0-9a-f]{48})(?:&|$)/i); return match ? match[1] : ''; }
  el('setup-form').onsubmit = function (event) { event.preventDefault(); var key = keyFrom(el('game-link').value); if (!key) { error(text('Link game không hợp lệ.', 'Invalid game link.')); return; } gameKey = key;
    if (window.Office && Office.context && Office.context.document) { Office.context.document.settings.set('quizzz.presentationKey', gameKey); Office.context.document.settings.saveAsync(); }
    begin();
  };
  el('new-display').onclick = function () { if (!window.confirm(text('Mở màn ghép nối mới? Lượt chơi cũ vẫn được lưu.', 'Open a new pairing display? Previous results are kept.'))) return; generation++; signature=''; window.clearTimeout(timer); current = null; remember(null); el('notice').textContent=text('Đang tạo QR mới…','Creating a new QR…'); el('stage').style.display='none'; el('waiting').style.display='none'; fresh(); };
  window.setInterval(clock, 250); window.addEventListener('beforeunload', function () { stopped = true; window.clearTimeout(timer); });
  gameKey = keyFrom(window.location.hash.slice(1));
  el('celebration-label').textContent = text('VINH DANH', 'PODIUM');
  el('celebration-title').textContent = text('Chúc mừng cả lớp!', 'Well done, everyone!');
  el('question-results-title').textContent = text('Tổng hợp kết quả câu hỏi', 'Question results');
  el('student-results-title').textContent = text('Kết quả từng em', 'Student answers');
  el('answer-chart').setAttribute('aria-label', text('Số học sinh chọn từng đáp án', 'Number of students per answer'));
  el('result-legend').textContent = text('Xanh: Đúng · Đỏ: Sai · —: Chưa trả lời', 'Green: Correct · Red: Incorrect · —: No answer');
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) api = window.location.origin + '/api/v1';
  if (en) { document.title='Quizzz · Game display';document.querySelector('.brand').textContent='QUIZZZ · CARD SCAN';el('setup-hint').textContent='Paste a saved game display link to attach it to this slide.';document.querySelector('label[for="game-link"]').textContent='Game display link';document.querySelector('#setup-form button').textContent='Attach game';el('qr').alt='Scanner connection QR';el('ranking-title').textContent='Leaderboard';el('waiting-title').textContent='Scan the QR with your phone';el('waiting-hint').textContent='Enter the 6-digit control PIN, then press Start on the phone.';el('pair-link').textContent='Open pairing page';el('new-display').textContent='Prepare a new run'; }
  if (gameKey) begin(); else {
    var office = document.createElement('script'); office.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js';
    office.onload = function () { Office.onReady(function () { var key=Office.context.document && Office.context.document.settings.get('quizzz.presentationKey'); if(key&&/^[0-9a-f]{48}$/i.test(key)) {gameKey=key;begin();} }); };
    office.onerror = function () { error(text('Chưa tải được add-in. Có thể dán link game để thử trong trình duyệt.', 'Could not load Office. Paste a game link to test in the browser.')); }; document.head.appendChild(office);
  }
}());
