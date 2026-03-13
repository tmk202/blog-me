import * as THREE from 'three';
import gsap from 'gsap';
import { STORY_CONFIG } from '../config/story';

export default class Experience {
    constructor(canvas) {
        window.experience = this;
        this.canvas = canvas;

        this.scene = new THREE.Scene();
        this.config = STORY_CONFIG;
        this.currentPartIndex = 0;
        
        // Continuous flow state
        this.scrollProgress = 0;
        this.targetScrollProgress = 0;
        this.textureLoader = new THREE.TextureLoader();
        this.assets = [];

        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupWorld();
        this.setupEvents();
        this.setupUI();

        this.update();
        this.goToPart(0);

        setTimeout(() => {
            const loader = document.querySelector('.loading-screen');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { loader.style.display = 'none'; }, 1000);
            }
        }, 1500);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        this.scene.add(this.camera);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0xffffff, 1);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);
    }

    setupWorld() {
        this.scene.fog = new THREE.FogExp2(0xffffff, 0.015);

        // Thin elegant track line
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-100, -3.5, 0),
            new THREE.Vector3(100, -3.5, 0)
        ]);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.05 
        });
        this.trackLine = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(this.trackLine);

        this.assetsGroup = new THREE.Group();
        this.scene.add(this.assetsGroup);

        this.config.tropicalAssets.forEach(data => {
            const texture = this.textureLoader.load(data.texture);
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0.85
            });
            const sprite = new THREE.Sprite(material);
            
            sprite.position.set(data.pos.x, data.pos.y, data.pos.z);
            sprite.scale.set(data.scale, data.scale, 1);
            
            sprite.userData = {
                originalX: data.pos.x,
                originalY: data.pos.y,
                parallax: data.parallax,
                phase: Math.random() * Math.PI * 2
            };

            this.assets.push(sprite);
            this.assetsGroup.add(sprite);
        });
    }

    setupUI() {
        const sideNav = document.querySelector('.side-nav');
        if (!sideNav) return;
        sideNav.innerHTML = '';
        this.config.parts.forEach((part, index) => {
            const dot = document.createElement('div');
            dot.classList.add('nav-dot');
            dot.setAttribute('data-title', part.title);
            dot.addEventListener('click', () => this.goToPart(index));
            sideNav.appendChild(dot);
        });
        this.updateNav();
    }

    updateNav() {
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPartIndex);
        });
    }

    goToPart(index) {
        if (this.currentPartIndex === index && this.uiInited) return;
        this.uiInited = true;
        this.currentPartIndex = index;
        const part = this.config.parts[index];

        const content = document.querySelector('.story-content');
        if (content) {
            content.classList.remove('visible');
            setTimeout(() => {
                document.querySelector('.subtitle').textContent = part.subtitle;
                document.querySelector('.title').textContent = part.title;
                document.querySelector('.description').textContent = part.content;
                document.documentElement.style.setProperty('--primary-color', part.theme.primaryColor);
                content.classList.add('visible');
            }, 800);
        }

        this.updateNav();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('wheel', (event) => {
            // Completely manual linear progression - NO SNAPPING
            const sensitivity = 0.0003;
            this.targetScrollProgress += event.deltaY * sensitivity;
            
            // Only update the UI/Text, do NOT animate or snap the scrollProgress
            this.syncPartToProgress();
        });
    }

    syncPartToProgress() {
        const progress = this.targetScrollProgress % 1.0;
        const normalized = progress < 0 ? 1 + progress : progress;
        
        let bestIndex = 0;
        let minDiff = Infinity;
        
        this.config.parts.forEach((part, index) => {
            const diff = Math.abs(part.scene.progress - normalized);
            if (diff < minDiff) {
                minDiff = diff;
                bestIndex = index;
            }
        });

        if (bestIndex !== this.currentPartIndex) {
            this.goToPart(bestIndex);
        }
    }

    update() {
        const elapsedTime = performance.now() * 0.001;

        // Smooth but responsive interpolation
        this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

        const loopWidth = 80; // Wider for more "natural" feel

        this.assets.forEach(sprite => {
            const data = sprite.userData;
            
            // Linear horizontal movement along the track
            let x = data.originalX - (this.scrollProgress * 60 * data.parallax);
            
            // Looping logic
            const halfLoop = loopWidth / 2;
            x = ((x + halfLoop) % loopWidth + loopWidth) % loopWidth - halfLoop;
            sprite.position.x = x;

            // Natural "Walking" bob: gentle vertical sine wave
            // Slightly offset each plant so they don't move in perfect sync
            const bobSpeed = 2;
            const bobAmount = 0.05;
            sprite.position.y = data.originalY + Math.sin(elapsedTime * bobSpeed + data.phase) * bobAmount;
            
            // Subtle rotation like leaves in a breeze
            sprite.rotation.z = Math.sin(elapsedTime * 0.5 + data.phase) * 0.02;
        });

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.update());
    }
}
