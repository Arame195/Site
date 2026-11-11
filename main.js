(function () {
  'use strict';
  const TELEGRAM_WORKER_URL = 'https://lively-feather-4f15.rwgjsrz5pk.workers.dev/';
  let telegramQueue = Promise.resolve();

  function sendAnswerToTelegram(question, answer) {
    telegramQueue = telegramQueue.then(function () {
      return fetch(TELEGRAM_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ question: question, answer: answer }),
        keepalive: true
      });
    }).catch(function (error) {
      console.error('Не удалось отправить ответ в Telegram:', error);
    });
    return telegramQueue;
  }
  const $ = function (selector) { return document.querySelector(selector); };
  const pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  const progressWrap = $('#progressWrap');
  const progressFill = $('#progressFill');
  const progressLabel = $('#progressLabel');
  const canvas = $('#stars');
  const context = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  let pixelRatio = 1;
  let stars = [];
  let datePlan = '';

  function setStars() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    canvas.width = Math.round(screenWidth * pixelRatio);
    canvas.height = Math.round(screenHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    stars = [];
    const count = Math.min(120, Math.round(screenWidth * screenHeight / 7800));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight,
        r: Math.random() * 1.25 + .25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * .7 + .35,
        gold: Math.random() > .82
      });
    }
  }

  function paintStars(time) {
    context.clearRect(0, 0, screenWidth, screenHeight);
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      context.globalAlpha = .2 + .55 * (Math.sin(time * .001 * star.speed + star.phase) * .5 + .5);
      context.fillStyle = star.gold ? '#f1c99a' : '#fff4ed';
      context.beginPath();
      context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    window.requestAnimationFrame(paintStars);
  }

  function goTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    pages.forEach(function (page) {
      const active = page === target;
      page.classList.toggle('active', active);
      page.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    const step = Number(target.dataset.step || 0);
    if (step > 0) {
      progressWrap.classList.add('visible');
      progressWrap.setAttribute('aria-hidden', 'false');
      progressFill.style.width = Math.round(step / 9 * 100) + '%';
      progressLabel.textContent = 'шаг ' + step + ' из 9';
    } else {
      progressWrap.classList.remove('visible');
      progressWrap.setAttribute('aria-hidden', 'true');
    }
    if (id === 'invitePage') {
      $('#chosenPlan').textContent = datePlan ? 'Твой выбор: ' + datePlan : '';
    }
    if (id === 'portraitPage') {
      const image = $('#portraitPage img');
      image.style.animation = 'none';
      void image.offsetWidth;
      image.style.animation = '';
    }
    if (id === 'bouquetPage') {
      document.querySelectorAll('.rose-head').forEach(function (head, index) {
        head.style.animationDelay = Math.min(index * 24, 720) + 'ms';
      });
    }
  }

  $('#startButton').addEventListener('click', function () {
    $('#envelope').classList.add('open');
    window.setTimeout(function () { goTo('q1'); }, reducedMotion ? 30 : 520);
  });

  document.querySelectorAll('.choice').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.choice').forEach(function (choice) { choice.disabled = true; });
      if (button.dataset.plan) datePlan = button.dataset.plan;
      const next = button.dataset.next;
      const page = button.closest('.page');
      const question = page.querySelector('.question-title')?.textContent.replace(/\s+/g, ' ').trim() || 'Вопрос';
      const answer = button.innerText.replace(/\s+/g, ' ').trim();
      sendAnswerToTelegram(question, answer);
      window.setTimeout(function () {
        document.querySelectorAll('.choice').forEach(function (choice) { choice.disabled = false; });
        goTo(next);
      }, reducedMotion ? 20 : 340);
    });
  });

  $('#toPortrait').addEventListener('click', function () { goTo('portraitPage'); });
  $('#toMoments').addEventListener('click', function () { goTo('momentsPage'); });
  $('#momentsNext').addEventListener('click', function () { goTo('bouquetPage'); });
  document.querySelectorAll('.moment-slot video').forEach(function (video) { video.addEventListener('loadeddata', function () { video.closest('.moment-slot').classList.add('has-video'); }); });
  $('#toInvite').addEventListener('click', function () { goTo('invitePage'); });
  $('#yesButton').addEventListener('click', function () {
    sendAnswerToTelegram('Приглашение', 'Давай выберем день ♡');
    $('#answer').textContent = 'Тогда я уже придумал наш первый красивый вечер ♡';
  });
  $('#thanksButton').addEventListener('click', function () {
    sendAnswerToTelegram('Приглашение', 'Нет');
    $('#answer').textContent = 'Это еще посмотрим😂 ♡';
  });

  let threeState = null;
  let threeLoading = false;
  const moduleUrl = 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

  function clamp01(value) { return Math.max(0, Math.min(1, value)); }
  function smooth01(value) {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  }

  async function startHeartShow() {
    if (threeLoading) return;
    if (threeState) {
      resetHeartShow();
      return;
    }
    threeLoading = true;
    const button = $('#heartStart');
    button.disabled = true;
    button.textContent = 'Готовлю звёздную магию…';
    try {
      const image = $('#heartPhoto');
      if (image.complete && !image.naturalWidth) throw new Error('Фотография не загрузилась');
      if (!image.complete) {
        await new Promise(function (resolve, reject) {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', reject, { once: true });
        });
      }
      const timeout = new Promise(function (_, reject) { window.setTimeout(function () { reject(new Error('Не удалось загрузить Three.js')); }, 12000); });
      const THREE = await Promise.race([import(moduleUrl), timeout]);
      createThreeHeartScene(THREE);
      button.hidden = true;
    } catch (error) {
      showHeartFallback();
    } finally {
      threeLoading = false;
    }
  }

  function showHeartFallback() {
    const page = $('#heartPage');
    page.classList.add('fallback');
    const orbit = $('#heartOrbitFallback');
    orbit.replaceChildren();
    for (let i = 0; i < 28; i++) {
      const heart = document.createElement('span');
      heart.textContent = '♥';
      heart.style.setProperty('--angle', (i * 360 / 28) + 'deg');
      heart.style.animationDelay = (-i * .22) + 's';
      orbit.appendChild(heart);
    }
    $('#heartPhotoFrame').classList.add('visible');
    $('#heartCaption').classList.add('visible');
    $('#heartTitle').innerHTML = 'Собрано<br><em>с теплом для тебя</em>';
    $('#heartCopy').textContent = 'Сердечки кружатся вокруг твоего фото. Чтобы включить 3D-анимацию, открой страницу через локальный сервер или публичную ссылку.';
    $('#heartStart').hidden = true;
    $('#heartReplay').hidden = false;
    threeState = { fallback: true };
  }

  function resetHeartShow() {
    const state = threeState;
    $('#heartPhotoFrame').classList.remove('visible');
    $('#heartCaption').classList.remove('visible');
    $('#heartTitle').innerHTML = 'Можно я соберу<br><em>твою улыбку?</em>';
    $('#heartCopy').textContent = 'Нажми на кнопку — и смотри, как сердечки сложатся в твою фотографию.';
    $('#heartReplay').hidden = true;
    if (state && state.fallback) {
      window.setTimeout(function () {
        $('#heartPhotoFrame').classList.add('visible');
        $('#heartCaption').classList.add('visible');
        $('#heartTitle').innerHTML = 'Собрано<br><em>с теплом для тебя</em>';
        $('#heartCopy').textContent = 'Сердечки кружатся вокруг твоего фото.';
        $('#heartReplay').hidden = false;
      }, 450);
      return;
    }
    if (state) {
      state.startedAt = performance.now();
      state.finished = false;
      state.hasRevealed = false;
    }
  }

  function createThreeHeartScene(THREE) {
    const canvas = $('#heartCanvas');
    const photo = $('#heartPhoto');
    const photoFrame = $('#heartPhotoFrame');
    const caption = $('#heartCaption');
    const page = $('#heartPage');
    const title = $('#heartTitle');
    const copy = $('#heartCopy');

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    let width = window.innerWidth;
    let height = window.innerHeight;
    const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, .1, 200);
    camera.position.z = 80;

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -.52);
    heartShape.bezierCurveTo(-.18, -.34, -.62, -.05, -.58, .25);
    heartShape.bezierCurveTo(-.55, .58, -.15, .66, 0, .34);
    heartShape.bezierCurveTo(.15, .66, .55, .58, .58, .25);
    heartShape.bezierCurveTo(.62, -.05, .18, -.34, 0, -.52);
    const heartGeometry = new THREE.ShapeGeometry(heartShape, 10);
    const positionAttribute = heartGeometry.getAttribute('position');
    heartGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(positionAttribute.count * 3).fill(1), 3));

    const columns = 52;
    const rows = 70;
    const pixelCanvas = document.createElement('canvas');
    pixelCanvas.width = columns;
    pixelCanvas.height = rows;
    const pixelContext = pixelCanvas.getContext('2d', { willReadFrequently: true });
    const drawScale = Math.max(columns / photo.naturalWidth, rows / photo.naturalHeight);
    const drawWidth = photo.naturalWidth * drawScale;
    const drawHeight = photo.naturalHeight * drawScale;
    pixelContext.drawImage(photo, (columns - drawWidth) / 2, (rows - drawHeight) / 2, drawWidth, drawHeight);
    const pixels = pixelContext.getImageData(0, 0, columns, rows).data;

    const portraitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const portraitMesh = new THREE.InstancedMesh(heartGeometry, portraitMaterial, columns * rows);
    portraitMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const portraitParticles = [];
    const target = function (column, row) {
      const rect = photoFrame.getBoundingClientRect();
      return {
        x: rect.left + rect.width * (column + .5) / columns - width / 2,
        y: height / 2 - rect.top - rect.height * (row + .5) / rows
      };
    };

    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const pixelIndex = (row * columns + column) * 4;
        color.setRGB(
          pixels[pixelIndex] / 255,
          pixels[pixelIndex + 1] / 255,
          pixels[pixelIndex + 2] / 255,
          THREE.SRGBColorSpace
        );
        portraitMesh.setColorAt(index, color);
        const point = target(column, row);
        portraitParticles.push({
          x: point.x,
          y: point.y,
          angle: Math.random() * Math.PI * 2,
          radius: .4 + Math.random() * .8,
          delay: Math.random(),
          size: .84 + Math.random() * .32
        });
        index++;
      }
    }
    scene.add(portraitMesh);

    const orbitCount = 84;
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const orbitMesh = new THREE.InstancedMesh(heartGeometry, orbitMaterial, orbitCount);
    orbitMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const orbitParticles = [];
    const palette = ['#f5b8c3', '#f7d7ae', '#fff2e9', '#d9879b'];
    for (let i = 0; i < orbitCount; i++) {
      color.set(palette[i % palette.length]);
      orbitMesh.setColorAt(i, color);
      orbitParticles.push({
        angle: i * Math.PI * 2 / orbitCount,
        speed: .17 + Math.random() * .17,
        radius: .94 + Math.random() * .18,
        size: 7 + Math.random() * 6,
        phase: Math.random() * Math.PI * 2,
        direction: i % 2 ? 1 : -1
      });
    }
    scene.add(orbitMesh);

    const ringPoints = new THREE.EllipseCurve(0, 0, 1, 1, 0, Math.PI * 2, false, 0).getPoints(128);
    const ringGeometry = new THREE.BufferGeometry().setFromPoints(
      ringPoints.map(function (point) { return new THREE.Vector3(point.x, point.y, -2); })
    );
    const ring = new THREE.LineLoop(
      ringGeometry,
      new THREE.LineBasicMaterial({ color: 0xe8c791, transparent: true, opacity: .22 })
    );
    scene.add(ring);

    const startedAt = performance.now();
    const state = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      portraitMaterial: portraitMaterial,
      portraitMesh: portraitMesh,
      orbitMaterial: orbitMaterial,
      orbitMesh: orbitMesh,
      ring: ring,
      particles: portraitParticles,
      orbitParticles: orbitParticles,
      startedAt: startedAt,
      finished: false,
      hasRevealed: false,
      frame: 0,
      destroyed: false
    };
    threeState = state;
    window.addEventListener('resize', function () {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
    });

    function renderFrame(now) {
      if (state.destroyed) return;
      const elapsed = (now - state.startedAt) / 1000;
      const progress = clamp01(elapsed / 4.4);
      const frameRect = photoFrame.getBoundingClientRect();
      const centerX = frameRect.left + frameRect.width / 2 - width / 2;
      const centerY = height / 2 - frameRect.top - frameRect.height / 2;
      const cellSize = Math.min(frameRect.width / columns, frameRect.height / rows);
      const emergence = smooth01((elapsed - 3.25) / 1.35);

      for (let i = 0; i < portraitParticles.length; i++) {
        const particle = portraitParticles[i];
        const orbitAngle = particle.angle + elapsed * .52;
        const radius = Math.max(width, height) * (.32 + particle.radius * .26);
        const fromX = centerX + Math.cos(orbitAngle) * radius;
        const fromY = centerY + Math.sin(orbitAngle) * radius * .58;
        const local = smooth01((progress - particle.delay * .22) / .78);
        const spiral = (1 - local) * 18;
        particle.x = frameRect.left + frameRect.width * ((i % columns) + .5) / columns - width / 2;
        particle.y = height / 2 - frameRect.top - frameRect.height * (Math.floor(i / columns) + .5) / rows;
        const x = fromX + (particle.x - fromX) * local + Math.cos(orbitAngle * 2) * spiral;
        const y = fromY + (particle.y - fromY) * local + Math.sin(orbitAngle * 2) * spiral;
        const z = Math.sin(orbitAngle + particle.delay * 7) * (1 - local) * 16;
        const size = cellSize * 1.06 * particle.size;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, orbitAngle * .35 * (1 - local));
        dummy.scale.set(size, size, size);
        dummy.updateMatrix();
        portraitMesh.setMatrixAt(i, dummy.matrix);
      }
      portraitMesh.instanceMatrix.needsUpdate = true;
      portraitMaterial.opacity = 1 - emergence;


      const orbitVisibility = smooth01((elapsed - 3.45) / 1.25);
      orbitMaterial.opacity = orbitVisibility * .98;

      const rx = frameRect.width * .67;
      const ry = frameRect.height * .61;
      ring.position.set(centerX, centerY, -2);
      ring.scale.set(rx, ry, 1);
      for (let i = 0; i < orbitParticles.length; i++) {
        const p = orbitParticles[i];
        const angle = p.angle + elapsed * p.speed * p.direction;
        const x = centerX + Math.cos(angle) * rx * p.radius;
        const y = centerY + Math.sin(angle) * ry * p.radius + Math.sin(elapsed * 1.3 + p.phase) * 5;
        dummy.position.set(x, y, Math.sin(angle * 2) * 4);
        dummy.rotation.set(0, 0, angle + Math.PI / 2);
        dummy.scale.set(p.size, p.size, p.size);
        dummy.updateMatrix();
        orbitMesh.setMatrixAt(i, dummy.matrix);
      }
      orbitMesh.instanceMatrix.needsUpdate = true;

      if (!state.hasRevealed && elapsed > 3.45) {
        state.hasRevealed = true;
        photoFrame.classList.add('visible');
        caption.classList.add('visible');
        title.innerHTML = 'Вот для кого<br><em>летят сердечки</em>';
        copy.textContent = 'Собрано по кусочкам — и теперь пусть эти сердечки кружатся рядом с тобой.';
        $('#heartReplay').hidden = false;
      }
      renderer.render(scene, camera);
      state.frame = window.requestAnimationFrame(renderFrame);
    }
    state.frame = window.requestAnimationFrame(renderFrame);
  }

  $('#toHeart').addEventListener('click', function () { goTo('heartPage'); });
  $('#heartStart').addEventListener('click', startHeartShow);
  $('#heartReplay').addEventListener('click', resetHeartShow);

  function createBouquet() {
    const stems = document.getElementById('stems');
    const heads = document.getElementById('roseHeads');
    const svgNS = 'http://www.w3.org/2000/svg';
    const rows = [
      { y: 43, xs: [120, 180, 240, 300, 360] },
      { y: 81, xs: [90, 150, 210, 270, 330, 390] },
      { y: 119, xs: [60, 120, 180, 240, 300, 360, 420] },
      { y: 157, xs: [60, 120, 180, 240, 300, 360, 420] },
      { y: 195, xs: [90, 150, 210, 270, 330, 390] }
    ];
    const centers = [];
    rows.forEach(function (row) {
      row.xs.forEach(function (x) { centers.push({ x: x, y: row.y }); });
    });
    centers.forEach(function (center, index) {
      const stem = document.createElementNS(svgNS, 'path');
      const bend = ((index % 5) - 2) * 5;
      stem.setAttribute('d', 'M' + center.x + ' ' + (center.y + 10) + ' C' + (center.x + bend) + ' 245 ' + (240 + bend) + ' 283 240 327');
      stem.setAttribute('fill', 'none');
      stem.setAttribute('stroke', index % 3 === 0 ? '#718362' : '#59745d');
      stem.setAttribute('stroke-width', '2.2');
      stem.setAttribute('opacity', '.85');
      stems.appendChild(stem);
    });
    centers.forEach(function (center, index) {
      const group = document.createElementNS(svgNS, 'g');
      group.setAttribute('transform', 'translate(' + center.x + ' ' + center.y + ')');
      group.setAttribute('class', 'rose-head');
      group.setAttribute('aria-hidden', 'true');

      const flower = document.createElementNS(svgNS, 'g');
      const scale = .92 + (index % 4) * .045;
      flower.setAttribute('transform', 'scale(' + scale + ')');
      for (let petal = 0; petal < 8; petal++) {
        const ellipse = document.createElementNS(svgNS, 'ellipse');
        ellipse.setAttribute('cx', '0');
        ellipse.setAttribute('cy', '-8.5');
        ellipse.setAttribute('rx', '7.6');
        ellipse.setAttribute('ry', '12');
        ellipse.setAttribute('transform', 'rotate(' + (petal * 45) + ')');
        ellipse.setAttribute('fill', petal % 2 === 0 ? 'url(#petal)' : 'url(#petalAlt)');
        ellipse.setAttribute('stroke', '#cf748d');
        ellipse.setAttribute('stroke-width', '.8');
        flower.appendChild(ellipse);
      }
      const centerPetal = document.createElementNS(svgNS, 'circle');
      centerPetal.setAttribute('r', '6.8');
      centerPetal.setAttribute('fill', index % 3 === 0 ? '#cf7489' : '#df8999');
      centerPetal.setAttribute('stroke', '#ffe1dc');
      centerPetal.setAttribute('stroke-width', '1');
      flower.appendChild(centerPetal);
      const curl = document.createElementNS(svgNS, 'path');
      curl.setAttribute('d', 'M-3 1 C-5 -5 4 -7 5 -2 C6 2 0 5 -2 2 C-4 -1 1 -3 2 -1');
      curl.setAttribute('fill', 'none');
      curl.setAttribute('stroke', '#fff0e7');
      curl.setAttribute('stroke-width', '1.2');
      curl.setAttribute('stroke-linecap', 'round');
      flower.appendChild(curl);
      group.appendChild(flower);
      heads.appendChild(group);
    });
  }

  createBouquet();
  window.addEventListener('resize', setStars);
  setStars();
  window.requestAnimationFrame(paintStars);
}());