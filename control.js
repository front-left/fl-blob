const musicSrc = 'assets/datawave-latitude.mp3';
// "https://www.youtube.com/embed/tvqh-QMNkX8"

const fftSz    = 1024;
const LOW_FREQ_BAND = 3;  // LOW: BANDS 0-3
const MID_FREQ_BAND = 11; // MID: BANDS 4-23, HIGH: BANDS 24-511

let audioCtx, audio, stream, analyser, buf, bufLength, sensitivity;
let initialised = false, playing = false;
let data = {
    low:0,
    mid:0,
    high:0
}
// let canvas = document.getElementById('canvas');
let play = document.getElementById('play');

function init(){
    audioCtx  = new AudioContext();
    audio = document.createElement('audio');
    audio.src = musicSrc;
    audio.loop = true;
    audio.crossOrigin = "anonymous";

    stream = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSz;
    analyser.minDecibels = -90;
    sensitivity = 1.0
    sensitivity = Math.min(Math.max(0, sensitivity), 2);
    analyser.maxDecibels = -40*sensitivity;
    analyser.smoothingTimeConstant = 0.75;
    bufLength = analyser.frequencyBinCount;
    buf = new Uint8Array(bufLength);

    stream.connect(analyser);
    analyser.connect(audioCtx.destination)
}

let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
if(isMobile){
    console.log("mobile")
}

window.onload = () => {
    requestAnimationFrame(animate);
    
    if(!isMobile){
        play.addEventListener('click', playAudio, false);
    }
    else{
        // play.addEventListener('mouseup', playAudio, false);
        play.addEventListener('touchend', playAudio, false);
    }
    

    function playAudio(){
        if(!initialised){
            init();
            initialised = true;
        }
        if(!playing){
            audio.play();
            play.innerHTML = 'Pause';
        } else {
            audio.pause();
            play.innerHTML = 'Play';
        }
        playing = !playing; 
    }
    // play.addEventListener('click', () => {
    //     if(!initialised){
    //         init();
    //         initialised = true;
    //     }
    //     if(!playing){
    //         audio.play();
    //         play.innerHTML = 'Pause';
    //     } else {
    //         audio.pause();
    //         play.innerHTML = 'Play';
    //     }
    //     playing = !playing;
    // });

    window.onresize = () => {
        renderer.setSize(window.innerWidth,window.innerHeight); 
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
};

function analyseAudio(){
    analyser.getByteFrequencyData(buf);
    let e = 0;
    let i = 0;
    for (; i < LOW_FREQ_BAND; i++) e += buf[i];
    data.low = e * 1/LOW_FREQ_BAND * 1/255;
    
    e = 0;
    for (; i < MID_FREQ_BAND; i++) e += buf[i];
    data.mid = e * 1/(MID_FREQ_BAND - LOW_FREQ_BAND) * 1/255;

    e = 0;
    for (; i < bufLength; i++) e += buf[i];
    data.high = e * 1/(bufLength - MID_FREQ_BAND) * 1/255;
}



var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById('canvas'), antialias:true});

renderer.setPixelRatio(window.devicePixelRatio);
// set size of canvas within window //
renderer.setSize(window.innerWidth, window.innerHeight);




var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 5;


var sphere_geometry = new THREE.SphereGeometry(1, 128, 128);
var material = new THREE.MeshNormalMaterial();

var sphere = new THREE.Mesh(sphere_geometry, material);
scene.add(sphere);


var update = function() {

    let agg, k;
    if(playing){
        agg = 7* data.low;
        k = 10 * data.high
    } else{
        
        agg = performance.now() * 0.0009 ;
        k = 1;
    }
    for (var i = 0; i < sphere.geometry.vertices.length; i++) {
        var p = sphere.geometry.vertices[i];
        //PERLIN NOISE FILTER
        p.normalize().multiplyScalar(1 + 0.3 * noise.perlin3(p.x * k , p.y * k, p.z * k + agg));
        // SIMPLEX NOISE FILTER 
        // p.normalize().multiplyScalar(1 + 0.3 * simplex.noise3D(p.x * k , p.y * k, p.z * k + agg));
        
    }      
    sphere.geometry.computeVertexNormals();
    sphere.geometry.normalsNeedUpdate = true;
    sphere.geometry.verticesNeedUpdate = true;
}
let simplex = new SimplexNoise();




function animate() {
    sphere.rotation.x += 0.001;
    sphere.rotation.y += 0.001;
    if(playing){
        analyseAudio();
    }
    update(); 
    /* render scene and camera */
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
}


