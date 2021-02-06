// 현재 표시되는 화면의 상태를 제어하는 변수
let status = 0;

// cloud 관련 변수
const tileCount = 100;
const noiseScale = 0.05;

var grid;
var xnoise;
var ynoise;
var t = 0;

let vid;

// Particle 관련 변수
let particles = [];
let nums = 0;
const NOISE_SCALE = 2400;
const MAX_LIFE = 10;
const SIMULATION_SPEED = 0.8;
const INIT_PARTICLE_NUM = 400;
const TEXT_SIZE_LOCATION = 15;
const TEXT_SIZE_INFO_TITLE = 30;
const TEXT_SIZE_INFO = 10;

let table_consumption; // 소비량 데이터
let table_output; // 발전량 데이터 
let table_info; // 출력할 데이터
let img_map; // 배경 이미지
let Rajdhani; // 폰트

// Flow 관련 변수
// https://kylemcdonald.github.io/cv-examples/
let capture;
let previousPixels;
let flow;
let w = 640,
  h = 480;
let step = 3;

// 각 지역의 좌표를 저장하는 리스트 (서울, 부산, ...)
let location_list = [];

let graphics_visualization;

let isConsumption = false;

/* preload() 함수란?
setup() 이전에 호출되어, 
프로그램 실행 이전에 프로그램에 필요한 데이터들을 불러온다.
레퍼런스 https://p5js.org/ko/reference/#/p5/preload
*/
function preload() {
  // 데이터를 초기화시키는 함수 호출
  initTable();
  initLocationList();

  // 배경 이미지를 불러와 초기화
  img_map = loadImage('Assets/test02.jpg');
  // 폰트를 불러와 초기화
  Rajdhani = loadFont("Assets/RajdhaniRegular.ttf");

}

// .CSV 데이터를 불러와서 table(표)를 초기화한다.
function initTable() {
  // 에너지 소비량 에 대한 .CSV 파일을 불러온다.
  // 이 .CSV 파일에는 각 행의 데이터가 무엇을 가리키는지 알려주는 header(첫번째 행)가 있다.
  table_consumption = loadTable('Assets/ENERGY_CONSUMPTION.csv', 'csv', 'header');

  // 에너지 발전량 에 대한 .CSV 파일을 불러온다.
  // 이 .CSV 파일에는 각 행의 데이터가 무엇을 가리키는지 알려주는 header(첫번째 행)가 있다.
  table_output = loadTable('Assets/ENERGY_OUTPUT.csv', 'csv', 'header');

  // 출력할 데이터에 대한 .CSV 파일을 불러온다.
  table_info = loadTable('Assets/location.csv', 'csv', 'header');
}

function initLocationList() {
  // 각 지역의 위치에 해당하는 좌표를 나타내는 Vector들을 location_list에 초기화 한다.
  // location_list
  // [ [850,250], [1200, 850], [1105, 740], ... , [1050, 700] ]
  location_list.push(createVector(850, 250)); // 1:서울
  location_list.push(createVector(1200, 850)); // 2:부산
  location_list.push(createVector(1105, 740)); // 3:대구
  location_list.push(createVector(750, 220)); // 4:인천
  location_list.push(createVector(820, 800)); // 5:광주
  location_list.push(createVector(975, 570)); // 6:대전
  location_list.push(createVector(1220, 765)); // 7:울산
  location_list.push(createVector(890, 300)); // 8:경기도
  location_list.push(createVector(1200, 250)); // 9:강원도
  location_list.push(createVector(1070, 400)); // 10:충청북도
  location_list.push(createVector(850, 500)); // 11:충청남도
  location_list.push(createVector(900, 650)); // 12:전라북도
  location_list.push(createVector(850, 820)); // 13:전라남도
  location_list.push(createVector(1210, 500)); // 14:경상북도
  location_list.push(createVector(1050, 700)); // 15:경상남도
}


/* setup() 함수란?
 프로그램이 실행되면 한 차례만 실행되는 함수로,
 예를 들자면, 그림을 그릴 캔버스의 크기, 폰트 등 
 한 번만 초기화해주면 되는 함수들이 실행된다.
*/
function setup() {
  // 캔버스 생성 : 1920 * 1080 크기
  createCanvas(1920, 1080);
  textFont(Rajdhani); // 폰트 초기화
  textSize(width / 200); // 글자 크기 초기화 : 화면 가로길이(1080) / 200

  // particles를 INIT_PARTICLE_NUM 개수만큼 초기화시킨다.
  for (let i = 0; i < INIT_PARTICLE_NUM; i++) {
    particles[i] = new Particle();
  }

  // 배경 이미지를 map으로 그린다.
  image(img_map, 0, 0);

  // 시각화 이미지가 그려지는 Graphics와 텍스트가 그려지는 Graphics를 초기화 한다.
  graphics_visualization = createGraphics(width, height);


  // video를 초기화 해준다.
  vid = createVideo(
    ['assets/click_icon.mp4'],
    vidLoad
  );
  vid.size(1920, 1080);

  // flow를 초기화 해준다.
  initFlow();
}


function vidLoad() {
  vid.loop();
  vid.volume(0);
  vid.hide();
  vid.size(1920, 1080);
}

function initFlow() {
  // 웹캠의 데이터를 가져오기 시작한다.
  capture = createCapture({
    audio: false,
    video: {
      width: w,
      height: h
    }
  }, function() {
    console.log('capture ready.')
  });
  capture.elt.setAttribute('playsinline', '');
  capture.hide();
  // flow를 계산하는 FlowCalculator를 초기화해준다.
  flow = new FlowCalculator(step);
}


//
// Cloud 관련 함수 시작
//

function createGrid() {
  grid = [];
  let tileSize = width / tileCount;
  ynoise = t;
  for (let row = 0; row < tileCount; row++) {
    grid[row] = [];
    xnoise = t;
    for (let col = 0; col < tileCount; col++) {
      let x = col * tileSize;
      let y = row * tileSize;
      let a = noise(xnoise, ynoise) * 255;
      grid[row][col] = new Tile(x, y, tileSize, a);
      xnoise += noiseScale;
    }
    ynoise += noiseScale;
  }
}

function showGrid() {
  for (let row = 0; row < tileCount; row++) {
    for (let col = 0; col < tileCount; col++) {
      grid[row][col].show();
    }
  }
}

class Tile {
  constructor(x, y, size, a) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.c = color(0, 80, 230, a * 0.23);
  }

  show() {
    noStroke();
    fill(this.c);
    rect(this.x, this.y, this.size, this.size);
  }
}


//
//  Flow 관련 함수 시작
//

function copyImage(src, dst) {
  var n = src.length;
  if (!dst || dst.length != n) dst = new src.constructor(n);
  while (n--) dst[n] = src[n];
  return dst;
}

function same(a1, a2, stride, n) {
  for (var i = 0; i < n; i += stride) {
    if (a1[i] != a2[i]) {
      return false;
    }
  }
  return true;
}




/* draw() 함수란?
 프로그램이 실행되면 setup() 이후에 계속해서 실행되는 함수로,
 예를 들자면, 매 프레임 새롭게 갱신된 파티클의 위치를 계산하거나
 새로운 위치에 파티클을 다시 그려주는 함수들이 실행된다.
*/
function draw() {

  switch (status) {
    case 0: // 구름
      DrawCloud();
      break;
    case 1: // 발전량
      DrawOutput();
      break;
    case 2: // 소비량
      DrawConsumption();
      break;
    case 3: // flow
      DrawFlow();
      break;
    case 4: // 메세지
      DrawMessage();
      break;
  }

}

function DrawCloud() {
  // Cloud 를 그려준다.
  background(150, 180, 255);

  image(vid, 0, 0, width, height);
  createGrid();
  showGrid();
  t += 0.01;
}

function DrawConsumption() {
  // 배경 이미지를 그린다.
  image(img_map, 0, 0);

  // 지역 이름을 그린다.
  index_location = 0;
  for (l of location_list) {
    // 데이터를 읽어온다.
    let row = table_info.getRow(index_location);
    let location_name = row.getString(0);
    // 지도의 각 위치 위에 지역명 출력
    noStroke();
    fill(80);
    textSize(TEXT_SIZE_LOCATION);
    textAlign(CENTER, CENTER);
    text(location_name, l.x, l.y);

    // 마우스가 hover 되었는지 확인했을 때,
    if (dist(mouseX, mouseY, l.x, l.y) <= 15) {

      let data_latitude = row.getString(1);
      let data_longitude = row.getString(2);
      let data_popularity = row.getString(3);

      let x_padding = 20;
      let y_padding = 30;
      let y_step = 15;

      // 텍스트 인포를 출력한다.
      textAlign(LEFT, TOP);
      textSize(TEXT_SIZE_INFO_TITLE);
      text(location_name, x_padding, y_padding);
      let space_between_info = 10;
      textSize(TEXT_SIZE_INFO);
      text(data_latitude + "\n" + data_longitude + "\n" + data_popularity, x_padding, y_padding + TEXT_SIZE_INFO_TITLE + space_between_info);
      textSize(TEXT_SIZE_LOCATION);
    }
    index_location += 1;
  }

  // draw options for good quality
  blendMode(BLEND);
  smooth();

  // nums(파티클의 개수)가 0보다 많으면 파티클을 그리는 함수를 호출한다.
  if (nums > 0) {
    drawParticles();
  }

  // 시각화를 위한 graphics를 표기한다
  image(graphics_visualization, 0, 0);

}

function DrawOutput() {

  // 배경 이미지를 그린다.
  image(img_map, 0, 0);

  // 지역 이름을 그린다.
  index_location = 0;
  for (l of location_list) {
    // 데이터를 읽어온다.
    let row = table_info.getRow(index_location);
    let location_name = row.getString(0);
    // 지도의 각 위치 위에 지역명 출력
    noStroke();
    fill(80);
    textSize(TEXT_SIZE_LOCATION);
    textAlign(CENTER, CENTER);
    text(location_name, l.x, l.y);

    // 마우스가 hover 되었는지 확인했을 때,
    if (dist(mouseX, mouseY, l.x, l.y) <= 15) {

      let data_latitude = row.getString(1);
      let data_longitude = row.getString(2);
      let data_popularity = row.getString(3);

      let x_padding = 20;
      let y_padding = 30;
      let y_step = 15;

      // 텍스트 인포를 출력한다.
      textAlign(LEFT, TOP);
      textSize(TEXT_SIZE_INFO_TITLE);
      text(location_name, x_padding, y_padding);
      let space_between_info = 10;
      textSize(TEXT_SIZE_INFO);
      text(data_latitude + "\n" + data_longitude + "\n" + data_popularity, x_padding, y_padding + TEXT_SIZE_INFO_TITLE + space_between_info);
      textSize(TEXT_SIZE_LOCATION);
    }
    index_location += 1;
  }

  // draw options for good quality
  blendMode(BLEND);
  smooth();

  // nums(파티클의 개수)가 0보다 많으면 파티클을 그리는 함수를 호출한다.
  if (nums > 0) {
    drawParticles();
  }

  // 시각화를 위한 graphics를 표기한다
  image(graphics_visualization, 0, 0);

}

function DrawFlow() {

  // 갱신된 웹캠의 데이터를 가져온다.
  capture.loadPixels();

  // 웹캠의 데이터가 있을 경우,
  if (capture.pixels.length > 0) {
    if (previousPixels) {
      // cheap way to ignore duplicate frames
      if (same(previousPixels, capture.pixels, 4, width)) {
        return;
      }

      // 이전 프레임과 현재 프레임의 픽셀을 비교 계산한다.
      flow.calculate(previousPixels, capture.pixels, capture.width, capture.height);
    }

    // 현재의 프레임의 픽셀들을 다음 프레임의 계산을 위해
    // 이전 프레임을 나타내는 previousPixels에 저장한다.
    previousPixels = copyImage(capture.pixels, previousPixels);

    //background(0);
    // 배경 이미지를 그린다.
    image(img_map, 0, 0);

    // 약간 투명한 검은 사각형을 화면크기 만큼 그려준다.
    noStroke();
    fill(0, 130);
    rect(0, 0, width, height);

    // flow를 그려준다.
    if (flow.flow && flow.flow.u != 0 && flow.flow.v != 0) {
      strokeWeight(3);
      flow.flow.zones.forEach(function(zone) {
        stroke(map(zone.u, -step * 3, +step * 3, 0, 99, 255),
          map(zone.v, -step * 3, +step * 3, 200, 0), 128);
        line(width-(zone.x * 3), zone.y * 3, width-(zone.x * 3 + zone.u * 1.5), zone.y * 3 + zone.v * 1.5);
      })
    }

    noFill();
    stroke(255);
  }
}

function DrawMessage() {
  // 배경 이미지를 그린다.
  image(img_map, 0, 0);

  // 약간 투명한 검은 사각형을 화면크기 만큼 그려준다.
  noStroke();
  fill(0, 80);
  rect(0, 0, width, height);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text("Message is Here. Please Type here.", width * 0.5, height * 0.5);
}

// 현재 상태를 바꿀 때 호출되면서 한번만 갱신되는 내용들을 실행하는 함수들!!
function changeStatus(target_status) {
  print("target: " + target_status);
  switch (target_status) {
    case 1: // Output
      print("target: output");
      graphics_visualization.remove();
      graphics_visualization = createGraphics(width, height);

      isConsumption = false;
      // particles를 INIT_PARTICLE_NUM 개수만큼 초기화시킨다.
      for (let i = 0; i < INIT_PARTICLE_NUM; i++) {
        particles[i] = new Particle();
      }

      // 발전량일 때.
      // 발전량을 새로운 날짜를 기준으로 그린다.
      drawElectricity(table_output);
      break;
    case 2: // Consumption
      print("target: consumption");
      graphics_visualization.remove();
      graphics_visualization = createGraphics(width, height);

      isConsumption = true;
      // particles를 INIT_PARTICLE_NUM 개수만큼 초기화시킨다.
      for (let i = 0; i < INIT_PARTICLE_NUM; i++) {
        particles[i] = new Particle();
      }

      // 소비량일 때,
      // 소비량을 새로운 날짜를 기준으로 그린다.
      drawElectricity(table_consumption);
      break;
  }
}

// Particle을 정의
function Particle() {
  // Particle의 멤버 변수 초기화
  this.vel = createVector(0, 0); // 속도
  this.pos = createVector(random(0, width), random(0, height)); // 시작위치
  this.life = random(0, MAX_LIFE); // 수명
  this.flip = int(random(0, 2)) * 2 - 1;
  // 색상 을 3가지 중 하나로 초기화
  let randColor = int(random(0, 3));
  if (isConsumption) {
    // 소비량 (노랑)
    switch (randColor) {
      case 0:
        this.color = color(255, 255, 224); // white
        break;
      case 1:
        this.color = color(255, 127, 0); // orange
        break;
      case 2:
        this.color = color(235, 255, 15); // yellow
        break;
    }
  } else {
    // 발전량 (파랑)
    switch (randColor) {
      case 0:
        this.color = color(110, 57, 204); // purple
        break;
      case 1:
        this.color = color(7, 153, 242); // blue
        break;
      case 2:
        this.color = color(255, 255, 255); // white
        break;
    }
  }


  // Particle의 멤버 함수 초기화
  this.move = function(iterations) {
    // 수명이 다하면 새로운 장소에서 생성
    if ((this.life -= 0.06667) < 0)
      this.respawn();

    while (iterations > 0) {
      let angle = noise(this.pos.x / NOISE_SCALE, this.pos.y / NOISE_SCALE) * TWO_PI * NOISE_SCALE * this.flip;
      this.vel.x = cos(angle);
      this.vel.y = sin(angle);
      this.vel.mult(SIMULATION_SPEED);
      this.pos.add(this.vel);
      --iterations;
    }
  }

  // 화면 가장자리와 충돌하면 새로운 장소에서 생성
  this.checkEdge = function() {
    if (this.pos.x > width || this.pos.x < 0 || this.pos.y > height || this.pos.y < 0) {
      this.respawn();
    }
  }

  // 새로운 장소에서 생성하는 함수 respawn
  this.respawn = function(x, y, d) {
    // ******* edit ******* 
    this.pos.x = random(x - d, x + d);
    this.pos.y = random(y - d, y + d);
    this.life = MAX_LIFE;
  }

  // 화면에 파티클을 그려주는 함수 display
  this.display = function(r) {
    graphics_visualization.ellipse(this.pos.x, this.pos.y, r, r);
  }
}

// 파티클을 그리는 함수
function drawParticles() {
  // update & draw particles
  for (let i = 0; i < particles.length; i++) {
    let iterations = map(i, 0, particles.length, 5, 1);
    let radius = map(i, 0, particles.length, 1, 5); // 파티클의 반지름 크기

    // 파티클의 위치를 update.
    particles[i].move(iterations);
    particles[i].checkEdge();

    // 파티클의 색상을 초기화
    let alpha = 255;
    let particleColor = particles[i].color; // 각 파티클이 갖고 있는 색상으로 초기화
    let fadeRatio;
    fadeRatio = min(particles[i].life * 5 / MAX_LIFE, 1);
    fadeRatio = min((MAX_LIFE - particles[i].life) * 5 / MAX_LIFE, fadeRatio);

    // 파티클 draw.
    graphics_visualization.noStroke();
    graphics_visualization.fill(red(particleColor), green(particleColor), blue(particleColor), alpha * fadeRatio);
    particles[i].display(radius);
  }
}


// 발전량을 그리는 함수
function drawElectricity(table) {
  noiseSeed(random() * Number.MAX_SAFE_INTEGER);

  // 이미지의 색조를 불투명하게 해서 
  // 이전까지의 그려진 흔적을 덮어씌운다.
  tint(255, 100);
  // 배경 이미지를 map으로 그린다.
  image(img_map, 0, 0);
  graphics_visualization.reset();

  let index_location = 0; // 현재 그리려는 지역의 index
  let index_month = floor(map(mouseX, 0, width, 1, table.getColumnCount())); // 현재 그리려는 월의 index : mouseX 좌표에 비례해서 설정.

  nums = 0;

  let index = 0;
  for (l of location_list) {
    // 데이터를 읽어온다.
    let row = table.getRow(index_location++);
    let location_name = row.getString(0);
    let data_electricity = row.getString(index_month);

    // 그리기 위한 값으로 발전량을 매핑
    let size = map(data_electricity, 0, 200000000, 10, 100);
    let numbers = map(data_electricity, 0, 200000000, 2, 10); // number of particle in this location

    // 데이터를 시각화
    max_nums = nums + numbers;
    for (let i = nums; i < max_nums; i++) {
      particles[i].respawn(l.x, l.y, size);
      particles[i].life = random(0, MAX_LIFE);
      nums++;
    }

    /*
    // 지도의 각 위치 위에 지역명 출력
    noStroke();
    fill(80);
    textAlign(CENTER, CENTER);
    text(location_name, l.x, l.y);

    // 좌측 상단 지역명 & 발전량 출력
    let x_padding = 20;
    let y_padding = 30;
    let y_step = 15;
    textAlign(LEFT, TOP)
    text(location_name + "  |  " + data_electricity, x_padding, y_padding + index * y_step);
    */
    index++;
  }
}


function mousePressed() {

  if (status > 4) {
    status = 0;
  } else {
    status++;
  }
  changeStatus(status);

  print(status);
  /*
  // 시각화 이미지가 그려지는 Graphics를 초기화 한다.
  graphics_visualization.remove();
  graphics_visualization = createGraphics(width, height);

  // particles를 INIT_PARTICLE_NUM 개수만큼 초기화시킨다.
  for (let i = 0; i < INIT_PARTICLE_NUM; i++) {
    particles[i] = new Particle();
  }


  isConsumption = !isConsumption;

  if (isConsumption) {
    // 소비량일 때,
    // 소비량을 새로운 날짜를 기준으로 그린다.
    drawElectricity(table_consumption);
  } else {
    // 발전량일 때.
    // 발전량을 새로운 날짜를 기준으로 그린다.
    drawElectricity(table_output);
  }
  */
}