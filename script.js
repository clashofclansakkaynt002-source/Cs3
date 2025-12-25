let scene, camera, renderer, player, bot;
let walls = [];
let botType = "";
let score = 0;

// Характери ботів
const types = [
    { name: "RUSHER", color: 0xff0000, speed: 0.08 }, // Червоний: завжди біжить
    { name: "STALKER", color: 0x00ff00, speed: 0.15 }, // Зелений: рухається тільки коли ти НЕ дивишся
    { name: "CAMPER", color: 0x0000ff, speed: 0.05 }  // Синій: ховається в кутках
];

init();
animate();

function init() {
    // 1. Сцена та Камера
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.15); // Туман для атмосфери

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. Світло (Ліхтарик)
    const flashlight = new THREE.SpotLight(0xffffff, 2, 20, Math.PI / 6, 0.5);
    camera.add(flashlight);
    flashlight.position.set(0, 0, 1);
    flashlight.target = camera;
    scene.add(camera);

    // 3. Підлога та Стіни
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    generateMaze();

    // 4. Створення бота
    const randomType = types[Math.floor(Math.random() * types.length)];
    botType = randomType.name;
    document.getElementById('bot-type').innerText = botType;

    const botGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const botMat = new THREE.MeshPhongMaterial({ color: randomType.color });
    bot = new THREE.Mesh(botGeo, botMat);
    bot.position.set(15, 1, 15);
    bot.userData = randomType;
    scene.add(bot);

    // Керування
    document.addEventListener('keydown', onKeyDown);
}

function generateMaze() {
    const wallGeo = new THREE.BoxGeometry(4, 4, 4);
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x444444 });

    for (let i = 0; i < 40; i++) {
        let wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(
            Math.floor(Math.random() * 20 - 10) * 4,
            2,
            Math.floor(Math.random() * 20 - 10) * 4
        );
        if (wall.position.length() > 5) { // Не ставити на гравця
            scene.add(wall);
            walls.push(wall);
        }
    }
}

function onKeyDown(event) {
    const speed = 0.5;
    if (event.key === 'w') camera.translateZ(-speed);
    if (event.key === 's') camera.translateZ(speed);
    if (event.key === 'a') camera.rotateY(0.1);
    if (event.key === 'd') camera.rotateY(-0.1);
}

function animate() {
    requestAnimationFrame(animate);

    // ЛОГІКА БОТА
    let playerDir = new THREE.Vector3();
    camera.getWorldDirection(playerDir);
    
    let dirToBot = new THREE.Vector3().subVectors(bot.position, camera.position).normalize();
    let dot = playerDir.dot(dirToBot); // Перевірка: чи бачимо ми бота?
    let isVisible = dot > 0.6;

    let moveDir = new THREE.Vector3().subVectors(camera.position, bot.position).normalize();

    if (botType === "RUSHER") {
        bot.position.add(moveDir.multiplyScalar(bot.userData.speed));
    } else if (botType === "STALKER") {
        if (!isVisible) { // Рухається тільки якщо ми НЕ дивимося
            bot.position.add(moveDir.multiplyScalar(bot.userData.speed));
        }
    } else if (botType === "CAMPER") {
        if (camera.position.distanceTo(bot.position) < 8) {
            bot.position.sub(moveDir.multiplyScalar(bot.userData.speed)); // Тікає
        }
    }

    // Перевірка смерті
    if (camera.position.distanceTo(bot.position) < 1.2) {
        document.getElementById('msg').innerText = "ГРА ЗАКІНЧЕНА. ВАС ПІЙМАЛИ!";
        return;
    }

    renderer.render(scene, camera);
}
