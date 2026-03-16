import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
        this.roadsideProps = []; // For animating roadside building parts (like doors)
        
        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.interactableObjects = []; // Add objects you want to be clickable here

        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupWorld();
        this.setupSky();
        this.setupExtraSkyElements();
        this.setupCacti();
        this.setupRocks();
        this.setupBushes();
        this.setupDeadTrees();
        this.setupSignposts();
        this.setupTumbleweeds();
        this.setupAdvancedFeatures();
        this.setupRoadDebris();
        this.setupBeetles();
        this.setupCamels(); 
        this.setupCar(); 
        this.setupTropicalAssets();
        this.setupMilestones();
        this.setupStartSign();
        this.setupRoadsideBuildings();
        this.setupWarGod();
        this.setupPyramids();
        this.setupNightGod();
        this.setupRelics();
        this.setupFuelStation();
        this.setupPowerLines();
        this.setupSmallDetails();
        this.setupMusic(); 
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
        // Tăng FOV (Field of View) lên 95 góc nhìn sẽ rộng và bao quát được nhiều cảnh hơn
        this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Đưa camera tiến lại gần một chút (z=12) và hơi nghiêng xuống (y=1) để bù đắp cho góc nhìn siêu rộng
        this.camera.position.set(0, 1, 12);
        this.scene.add(this.camera);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffcc80, 0.4); // Warm ambient
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.dirLight.position.set(-20, 15, 10); // Low angle for long shadows
        this.dirLight.castShadow = true;
        
        // Shadow optimization
        this.dirLight.shadow.camera.left = -50;
        this.dirLight.shadow.camera.right = 50;
        this.dirLight.shadow.camera.top = 50;
        this.dirLight.shadow.camera.bottom = -50;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.bias = -0.0005;
        
        this.scene.add(this.dirLight);
    }

    setupWorld() {
        const initialColor = this.config.parts[0].theme.backgroundColor.substring(0, 7);
        this.scene.background = new THREE.Color(initialColor);
        this.scene.fog = new THREE.FogExp2(initialColor, 0.015);

        // Remove old track line, replaced with detailed dusty road below 

        // --- Low Poly Desert Ground (Endless Horizontal Treadmill) ---
        // Increased resolution for vertex coloring and finer road details
        const terrainGeo = new THREE.PlaneGeometry(160, 80, 160, 60);
        terrainGeo.rotateX(-Math.PI / 2); 
        
        const posAttribute = terrainGeo.attributes.position;
        const colorAttribute = new THREE.Float32BufferAttribute(new Float32Array(posAttribute.count * 3), 3);
        terrainGeo.setAttribute('color', colorAttribute);
        
        const cSand = new THREE.Color('#d2b48c'); // Base sand
        const cRoad = new THREE.Color('#aa8760'); // Packed, darker dirt
        const cTrack = new THREE.Color('#8d6e63'); // Darker tire tracks
        const tempColor = new THREE.Color();

        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const z = posAttribute.getZ(i);
            const angle = (x / 160) * Math.PI * 2;
            
            // Dunes & ripples
            const bump = Math.sin(angle * 4 + z * 0.1) * 2.5 
                       + Math.cos(angle * 7 - z * 0.2) * 1.0
                       + Math.sin(angle * 14 + z * 0.3) * 0.5
                       + Math.sin(angle * 40 + z * 2.5) * 0.15;
            
            const roadWidth = 3.0; 
            const blendWidth = 8; 
            const distZ = Math.abs(z);
            
            let intensity = 1.0;
            let roadBump = 0;
            
            if (distZ < roadWidth) {
                intensity = 0;
                // Irregularity on road surface
                roadBump = (Math.sin(x * 3.5) * 0.05) + (Math.sin(x * 12.0) * 0.02);
                
                // Indent tire tracks
                const isTrackL = Math.abs(z - 0.7) < 0.4;
                const isTrackR = Math.abs(z + 0.7) < 0.4;
                if (isTrackL || isTrackR) {
                    roadBump -= 0.08; 
                    tempColor.copy(cTrack); 
                } else {
                    tempColor.copy(cRoad);
                }
                
                // Add color noise/dust
                tempColor.r += (Math.random() - 0.5) * 0.03;
                tempColor.g += (Math.random() - 0.5) * 0.03;
            } else if (distZ < roadWidth + blendWidth) {
                const t = (distZ - roadWidth) / blendWidth;
                intensity = t * t * (3 - 2 * t);
                tempColor.copy(cRoad).lerp(cSand, t);
                
                // Mottled blending edge
                if (Math.random() > 0.8) {
                    tempColor.multiplyScalar(0.95);
                }
            } else {
                tempColor.copy(cSand);
            }
            
            posAttribute.setY(i, (bump * intensity) + roadBump);
            colorAttribute.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
        terrainGeo.computeVertexNormals();

        const groundMat = new THREE.MeshStandardMaterial({ 
            vertexColors: true,
            roughness: 0.9,
            flatShading: true
        });
        
        this.ground1 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground2 = new THREE.Mesh(terrainGeo, groundMat);
        this.ground1.receiveShadow = true;
        this.ground2.receiveShadow = true;
        
        // Place them side-by-side to create an endless loop
        this.ground1.position.set(0, 0, 0); // World center
        this.ground2.position.set(160, 0, 0); // Next to it

        this.groundGroup = new THREE.Group();
        this.groundGroup.add(this.ground1);
        this.groundGroup.add(this.ground2);
        
        // Base is at -3.5 down, so wheels exactly touch the flat road
        this.groundGroup.position.set(0, -3.5, 0);
        this.scene.add(this.groundGroup);

        this.assetsGroup = new THREE.Group();
        this.scene.add(this.assetsGroup);
    }

    setupCar() {
        this.carGroup = new THREE.Group();
        this.carGroup.position.set(2.5, -3.5, 0); // Position car on the right side
        this.scene.add(this.carGroup);

        this.carWheels = [];
        this.carBody = new THREE.Group(); // Sub-group for bounce animation
        this.carGroup.add(this.carBody);

        const loader = new GLTFLoader();
        loader.load('/assets/models/low-poly_truck_car_drifter.glb', (gltf) => {
            const model = gltf.scene;
            
            // Adjust scale and rotation if needed (common for downloaded models)
            model.scale.set(0.01, 0.01, 0.01);
            model.rotation.y = 0; // Test default orientation
            model.position.y = 0.3; // Sit on road level
            
            this.carBody.add(model);

            // --- Play built-in GLB animations (smoke, wheels, etc.) ---
            if (gltf.animations && gltf.animations.length > 0) {
                this.carMixer = new THREE.AnimationMixer(model);
                
                console.log('Car animations found:');
                gltf.animations.forEach((clip, i) => {
                    console.log(` [${i}] ${clip.name} (${clip.duration.toFixed(2)}s)`);
                    const action = this.carMixer.clipAction(clip);
                    action.play(); // Play ALL animations (smoke, exhaust, etc.)
                });
            } else {
                console.log('No animations found in car model.');
            }

            // First pass: collect all meshes to avoid modifying the tree during traversal
            const meshesToOutline = [];
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Detect wheels by name (case-insensitive)
                    const name = child.name.toLowerCase();
                    if (name.includes('wheel') || name.includes('rim') || name.includes('tire')) {
                        this.carWheels.push(child);
                    }
                    
                    // Tag and add to interactable objects
                    child.userData.isCarPart = true;
                    this.interactableObjects.push(child);
                    meshesToOutline.push(child);
                }
            });

            // Second pass: Create Manual Outline (Inverted Shell)
            const outlineMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                side: THREE.BackSide,
                transparent: true,
                opacity: 1
            });

            meshesToOutline.forEach(child => {
                const outline = new THREE.Mesh(child.geometry, outlineMat);
                // Matches the child's world scale/pos via parent-child relationship
                outline.scale.set(1.04, 1.04, 1.04); 
                outline.visible = false; 
                outline.castShadow = false;
                outline.receiveShadow = false;
                child.add(outline);
                child.userData.outline = outline;
            });

            console.log(`Car Model Loaded. Found ${this.carWheels.length} wheels.`);
            
            // If no wheels found by name, we might need a fallback or manual tagging
            if (this.carWheels.length === 0) {
                console.warn("No wheels detected in car model. Manual mapping might be required.");
            }
        }, undefined, (error) => {
            console.error('Error loading car model:', error);
            // Fallback: simple box if loading fails
            const box = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshStandardMaterial({ color: 'red' }));
            this.carBody.add(box);
        });

        // Dummy carRoof to avoid errors in update loop (since 3D model has its own roof)
        this.carRoof = new THREE.Group(); 
        this.carGroup.add(this.carRoof);
    }

    setupTropicalAssets() {
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


    setupSky() {
        this.skyGroup = new THREE.Group();
        this.scene.add(this.skyGroup);

        // --- Create a group to hold the celestial body (can be sun or moon) ---
        this.celestialBody = new THREE.Group();
        this.skyGroup.add(this.celestialBody);

        // ===== DETAILED MOON =====
        this.moonGroup = new THREE.Group();

        // 1. Create Moon surface with crater canvas texture
        const moonCanvas = document.createElement('canvas');
        moonCanvas.width = 1024;
        moonCanvas.height = 512;
        const moonCtx = moonCanvas.getContext('2d');

        // Bright base color - warm white
        moonCtx.fillStyle = '#f0eadc';
        moonCtx.fillRect(0, 0, 1024, 512);

        // Draw craters (subtle, not too dark)
        const craters = [
            { x: 200, y: 150, r: 70, depth: 0.25 },
            { x: 500, y: 280, r: 100, depth: 0.2 },
            { x: 750, y: 120, r: 55, depth: 0.3 },
            { x: 850, y: 350, r: 80, depth: 0.22 },
            { x: 300, y: 370, r: 45, depth: 0.28 },
            { x: 100, y: 340, r: 35, depth: 0.25 },
            { x: 620, y: 180, r: 30, depth: 0.3 },
            { x: 920, y: 200, r: 40, depth: 0.2 },
            { x: 400, y: 100, r: 28, depth: 0.3 },
        ];

        craters.forEach(c => {
            // Shadow rim (very subtle)
            const rimGrad = moonCtx.createRadialGradient(c.x, c.y, c.r * 0.6, c.x, c.y, c.r * 1.1);
            rimGrad.addColorStop(0, `rgba(160,145,125,${c.depth * 0.5})`);
            rimGrad.addColorStop(1, 'rgba(240,234,220,0)');
            moonCtx.fillStyle = rimGrad;
            moonCtx.beginPath();
            moonCtx.arc(c.x, c.y, c.r * 1.1, 0, Math.PI * 2);
            moonCtx.fill();

            // Inner basin (light grey)
            const innerGrad = moonCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            innerGrad.addColorStop(0, `rgba(170,160,145,${c.depth * 0.7})`);
            innerGrad.addColorStop(0.8, `rgba(220,210,195,${c.depth * 0.3})`);
            innerGrad.addColorStop(1, 'rgba(240,234,220,0)');
            moonCtx.fillStyle = innerGrad;
            moonCtx.beginPath();
            moonCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            moonCtx.fill();
        });

        // Light surface noise
        for(let i = 0; i < 2000; i++) {
            const nx = Math.random() * 1024;
            const ny = Math.random() * 512;
            const alpha = Math.random() * 0.04;
            moonCtx.fillStyle = `rgba(160,150,130,${alpha})`;
            moonCtx.fillRect(nx, ny, Math.random() * 2, Math.random() * 2);
        }

        const moonTexture = new THREE.CanvasTexture(moonCanvas);

        // Moon sphere - bright emissive so it glows in the dark sky
        const moonGeo = new THREE.SphereGeometry(1, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.9,
            metalness: 0.0,
            emissive: new THREE.Color('#d4c8a8'),
            emissiveIntensity: 0.6, // Makes it glow brightly on its own
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.moonGroup.add(moonMesh);

        // Soft outer glow halo (blue-white)
        const haloGeo = new THREE.SphereGeometry(1.35, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: '#c8dce8',
            transparent: true,
            opacity: 0.08,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.moonGroup.add(new THREE.Mesh(haloGeo, haloMat));

        // Second larger halo for atmosphere
        const halo2Geo = new THREE.SphereGeometry(1.7, 32, 32);
        const halo2Mat = new THREE.MeshBasicMaterial({
            color: '#a0b8cc',
            transparent: true,
            opacity: 0.04,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.moonGroup.add(new THREE.Mesh(halo2Geo, halo2Mat));

        // ===== DETAILED SUN =====
        this.sunGroup = new THREE.Group();

        const sunGeo = new THREE.SphereGeometry(1, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: '#ffb703' });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);

        // Sun glow layers
        for (let i = 0; i < 3; i++) {
            const glowR = 1.2 + i * 0.3;
            const glowGeo = new THREE.SphereGeometry(glowR, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: '#ffe566',
                transparent: true,
                opacity: 0.05 - i * 0.012,
                side: THREE.BackSide,
                depthWrite: false
            });
            this.sunGroup.add(new THREE.Mesh(glowGeo, glowMat));
        }
        this.sunGroup.add(sunMesh);

        // Both start hidden; goToPart toggles them
        this.moonGroup.visible = false;
        this.sunGroup.visible = true;

        this.celestialBody.add(this.moonGroup);
        this.celestialBody.add(this.sunGroup);

        // Keep a material ref for legacy color tween compatibility
        this.celestialBody.material = sunMat;

        // Massive Stylized Architectural Clouds
        this.clouds = [];
        this.cloudMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            flatShading: true,
            roughness: 0.6,
            opacity: 0.8,
            transparent: true,
            emissive: new THREE.Color('#000000'),
            emissiveIntensity: 0.2
        });

        for(let i=0; i<6; i++) { 
            const cloudGroup = new THREE.Group();
            const numSegments = 6 + Math.floor(Math.random() * 6);
            
            for (let j = 0; j < numSegments; j++) {
                // Flat layered boxes for a more "designed" cloud look
                const w = 5 + Math.random() * 10;
                const h = 0.6 + Math.random() * 1.2;
                const d = 4 + Math.random() * 6;
                const geo = new THREE.BoxGeometry(w, h, d);
                const part = new THREE.Mesh(geo, this.cloudMat);
                
                part.position.x = j * 4.0;
                part.position.y = (Math.random() - 0.5) * 1.2;
                part.position.z = (Math.random() - 0.5) * 2.5;

                part.rotation.y = (Math.random() - 0.5) * 0.3;
                part.castShadow = true;
                cloudGroup.add(part);
            }
            
            const x = (Math.random() - 0.5) * 160;
            const y = 45 + Math.random() * 15; // Raised higher to clear massive statues
            const z = -50 - Math.random() * 20; // Pushed further back
            cloudGroup.position.set(x, y, z);
            
            cloudGroup.userData = {
                speed: 0.005 + Math.random() * 0.01
            };
            
            this.skyGroup.add(cloudGroup);
            this.clouds.push(cloudGroup);
        }

        // --- Low Poly Stars (for night parts) ---
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 4000;
        const posArray = new Float32Array(starsCount * 3);
        
        for(let i=0; i < starsCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 300;    // x wider
            posArray[i+1] = (Math.random() * 60) + 5;     // y higher
            posArray[i+2] = (Math.random() * -100) - 100; // Pushed MUCH further back to avoid clipping statues
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        this.starsMat = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true,
            depthWrite: false // Prevents sorting issues with transparent mists
        });
        
        this.stars = new THREE.Points(starsGeo, this.starsMat);
        this.scene.add(this.stars);

        // --- Milky Way Spiral Galaxy (from milkyway.html) ---
        const galaxyParams = {
            count: 15000,           
            size: 0.15,             
            radius: 50,
            branches: 3,
            spin: 0.8,
            randomness: 0.25,
            insideColor: 0xffffff,  
            middleColor: 0xffa500,  
            outsideColor: 0x0033ff  
        };

        const mwGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(galaxyParams.count * 3);
        const colors = new Float32Array(galaxyParams.count * 3);

        const colorInside = new THREE.Color(galaxyParams.insideColor);
        const colorMiddle = new THREE.Color(galaxyParams.middleColor);
        const colorOutside = new THREE.Color(galaxyParams.outsideColor);

        for (let i = 0; i < galaxyParams.count; i++) {
            const i3 = i * 3;
            
            const radius = Math.pow(Math.random(), 1.5) * galaxyParams.radius;
            const spinAngle = radius * galaxyParams.spin;
            const branchAngle = ((i % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2;

            const randomX = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius);
            const randomY = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius * 0.5);
            const randomZ = (Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius);

            // Positioning it in the back sky - even further
            positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = 35 + Math.sin(branchAngle + spinAngle) * (radius * 0.2) + randomY;
            positions[i3 + 2] = -120 + randomZ;

            let mixedColor;
            const ratio = radius / galaxyParams.radius;
            if (ratio < 0.2) {
                mixedColor = colorInside.clone().lerp(colorMiddle, ratio * 5);
            } else {
                mixedColor = colorMiddle.clone().lerp(colorOutside, (ratio - 0.2) * 1.25);
            }

            colors[i3 + 0] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        mwGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        mwGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.mwMat = new THREE.PointsMaterial({
            size: galaxyParams.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            transparent: true,
            opacity: 0
        });
        
        this.milkyWay = new THREE.Points(mwGeo, this.mwMat);
        this.skyGroup.add(this.milkyWay);

        // Core Light for the Galaxy
        this.galaxyCoreLight = new THREE.PointLight(0xffaa00, 0, 150);
        this.galaxyCoreLight.position.set(0, 40, -120);
        this.skyGroup.add(this.galaxyCoreLight);

        // --- Shooting Stars ---
        this.shootingStars = [];
        const ssGeo = new THREE.CylinderGeometry(0, 0.05, 4, 3);
        ssGeo.rotateX(Math.PI / 2); // Point along Z initially so lookAt aligns length correctly
        const ssMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        for(let i=0; i<3; i++) {
            const ss = new THREE.Mesh(ssGeo, ssMat);
            this.scene.add(ss);
            this.shootingStars.push({
                mesh: ss,
                active: false,
                life: 0,
                velocity: new THREE.Vector3()
            });
        }
    }

    setupExtraSkyElements() {
        // --- Low-Poly Paper Planes ---
        this.paperPlanes = [];
        const planeGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0.4,    // tip
            -0.4, 0.1, -0.2, // left wing back
            0, 0, 0.3,    // spine back
            
            0, 0, 0.4,
            0, 0, 0.3,
            0.4, 0.1, -0.2, // right wing back
            
            0, 0, 0.4,
            0, -0.15, 0.3, // bottom fold back
            0, 0, 0.3
        ]);
        planeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        planeGeo.computeVertexNormals();
        const planeMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide, 
            flatShading: true 
        });

        for(let i=0; i<8; i++) {
            const paperPlane = new THREE.Mesh(planeGeo, planeMat);
            paperPlane.position.set(20 + i*5, 7 + Math.random()*3, -15 + Math.random()*5);
            paperPlane.rotation.y = Math.PI; // Face forward
            
            paperPlane.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.04 + Math.random() * 0.04
            };
            
            this.paperPlanes.push(paperPlane);
            this.skyGroup.add(paperPlane);
        }

        // --- Low-Poly Hot Air Balloon ---
        this.balloons = [];
        const balloonGroup = new THREE.Group();
        
        const balloonGeo = new THREE.SphereGeometry(2, 8, 6); // Low res
        const balloonMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, flatShading: true });
        const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
        balloonGroup.add(balloonMesh);

        const basketGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -3;
        balloonGroup.add(basket);

        // Add 4 simple ropes
        const ropeMat = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true });
        for(let i=0; i<4; i++) {
            const ropeGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(i%2?0.3:-0.3, -3, i<2?0.3:-0.3)
            ]);
            balloonGroup.add(new THREE.Line(ropeGeo, ropeMat));
        }

        balloonGroup.position.set(-20, 10, -30);
        this.balloons.push(balloonGroup);
        this.skyGroup.add(balloonGroup);

        // --- God Rays (Volumetric Sunbeams) ---
        this.rayGroup = new THREE.Group();
        this.scene.add(this.rayGroup);
        this.rays = [];
        const rayGeo = new THREE.CylinderGeometry(0.1, 8, 40, 4, 1, true); // Tapered cone
        const rayMat = new THREE.MeshBasicMaterial({ 
            color: 0xfff9e6, 
            transparent: true, 
            opacity: 0, 
            depthWrite: false,
            side: THREE.DoubleSide
        });

        for(let i=0; i<6; i++) {
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.rotation.x = Math.PI/2;
            ray.rotation.z = (i / 6) * Math.PI * 2;
            this.rays.push(ray);
            this.rayGroup.add(ray);
        }
    }

    getTerrainHeight(x, z) {
        const angle = (x / 160) * Math.PI * 2;
        const bump = Math.sin(angle * 4 + z * 0.1) * 2.5 
                   + Math.cos(angle * 7 - z * 0.2) * 1.0
                   + Math.sin(angle * 14 + z * 0.3) * 0.5
                   + Math.sin(angle * 40 + z * 2.5) * 0.15; 
        
        const roadWidth = 3.0;
        const blendWidth = 8;
        const distZ = Math.abs(z);
        
        let intensity = 1.0;
        let roadBump = 0;
        
        if (distZ < roadWidth) {
            intensity = 0;
            roadBump = (Math.sin(x * 3.5) * 0.05) + (Math.sin(x * 12.0) * 0.02);
            if (Math.abs(z - 0.7) < 0.4 || Math.abs(z + 0.7) < 0.4) {
                roadBump -= 0.08;
            }
        } else if (distZ < roadWidth + blendWidth) {
            const t = (distZ - roadWidth) / blendWidth;
            intensity = t * t * (3 - 2 * t);
        }
        
        return (bump * intensity) + roadBump - 3.5; 
    }

    setupCacti() {
        this.cactiGroup = new THREE.Group();
        this.groundGroup.add(this.cactiGroup);
        this.cacti = [];
        
        const cactusMat = new THREE.MeshStandardMaterial({ 
            color: '#43a047', 
            flatShading: true,
            roughness: 0.9 
        });

        const flowerMat = new THREE.MeshStandardMaterial({
            color: '#ff4081', // Pink/red flower
            flatShading: true, 
            roughness: 0.5
        });

        const totalWidth = 160;
        
        // Base geometries
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 7);
        trunkGeo.translate(0, 0.75, 0); 
        const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
        armGeo.translate(0, 0.4, 0);
        const elbowGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const flowerGeo = new THREE.DodecahedronGeometry(0.1, 0);
        
        // --- Variant 2: Prickly Pear (Paddle shape) geometries
        const paddleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
        paddleGeo.rotateX(Math.PI / 2); // flatten

        for(let i = 0; i < 70; i++) {
            const cactusGroup = new THREE.Group();
            
            // Randomly choose Saguaro (tall) vs Prickly Pear (short flat)
            const type = Math.random() > 0.3 ? 'saguaro' : 'prickly';
            
            if (type === 'saguaro') {
                const trunk = new THREE.Mesh(trunkGeo, cactusMat);
                const scaleY = 0.8 + Math.random() * 1.5;
                const scaleXZ = 0.8 + Math.random() * 0.5;
                trunk.scale.set(scaleXZ, scaleY, scaleXZ);
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                cactusGroup.add(trunk);

                const numArms = 1 + Math.floor(Math.random() * 3);
                for (let a = 0; a < numArms; a++) {
                    const armWrapper = new THREE.Group();
                    
                    // The horizontal stalk out from the trunk
                    const hStalk = new THREE.Mesh(armGeo, cactusMat);
                    hStalk.scale.set(scaleXZ * 0.8, 0.5 * scaleXZ, scaleXZ * 0.8);
                    hStalk.rotation.z = Math.PI / 2;
                    hStalk.castShadow = true;
                    hStalk.receiveShadow = true;
                    armWrapper.add(hStalk);
                    
                    // Elbow joint
                    const elbow = new THREE.Mesh(elbowGeo, cactusMat);
                    elbow.scale.setScalar(scaleXZ * 0.9);
                    elbow.position.x = 0.4 * scaleXZ;
                    elbow.castShadow = true;
                    armWrapper.add(elbow);

                    // The vertical stalk going up
                    const vStalk = new THREE.Mesh(armGeo, cactusMat);
                    const vLen = 0.5 + Math.random() * 0.8;
                    vStalk.scale.set(scaleXZ * 0.8, vLen, scaleXZ * 0.8);
                    vStalk.position.x = 0.4 * scaleXZ;
                    vStalk.castShadow = true;
                    vStalk.receiveShadow = true;
                    armWrapper.add(vStalk);
                    
                    // Attach arm to trunk
                    armWrapper.position.y = 0.5 + Math.random() * (1.5 * scaleY - 0.7);
                    armWrapper.rotation.y = (Math.PI * 2 / numArms) * a + Math.random();
                    
                    // Maybe add a flower on top of vertical stalk
                    if (Math.random() > 0.7) {
                        const flower = new THREE.Mesh(flowerGeo, flowerMat);
                        flower.position.set(0.4 * scaleXZ, vLen * 0.8, 0);
                        armWrapper.add(flower);
                    }
                    
                    cactusGroup.add(armWrapper);
                }
            } else {
                // Prickly Pear style
                const numPaddles = 3 + Math.floor(Math.random() * 5);
                const paddles = []; // Keep track of positions to attach to
                
                for(let p = 0; p < numPaddles; p++) {
                    const paddle = new THREE.Mesh(paddleGeo, cactusMat);
                    const pScale = 0.5 + Math.random() * 0.8;
                    paddle.scale.setScalar(pScale);
                    paddle.castShadow = true;
                    paddle.receiveShadow = true;
                    
                    if (p === 0) {
                        // Base paddle
                        paddle.position.y = 0.2 * pScale;
                        paddle.rotation.y = Math.random() * Math.PI;
                        paddle.rotation.z = (Math.random() - 0.5) * 0.3;
                    } else {
                        // Pick a random existing paddle to grow out of
                        const parent = paddles[Math.floor(Math.random() * paddles.length)];
                        paddle.position.copy(parent.position);
                        
                        // Move up and out
                        paddle.position.y += 0.3 * parent.scale.y + 0.1 * pScale;
                        paddle.position.x += (Math.random() - 0.5) * 0.5;
                        paddle.position.z += (Math.random() - 0.5) * 0.5;
                        
                        paddle.rotation.y = Math.random() * Math.PI;
                        paddle.rotation.z = (Math.random() - 0.5) * 0.8;
                        paddle.rotation.x = (Math.random() - 0.5) * 0.8;
                    }
                    
                    if(Math.random() > 0.8) {
                        const flower = new THREE.Mesh(flowerGeo, flowerMat);
                        flower.position.y = 0.2 * pScale;
                        paddle.add(flower);
                    }
                    
                    paddles.push(paddle);
                    cactusGroup.add(paddle);
                }
            }

            const lx = (Math.random() * totalWidth) - 80; 
            const lz = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 25);
            const ly = this.getTerrainHeight(lx, lz) + 3.5; 
            
            cactusGroup.position.set(lx, ly, lz);
            cactusGroup.rotation.y = Math.random() * Math.PI;

            const cactusCopy = cactusGroup.clone();
            cactusCopy.position.x += 160;
            
            this.cactiGroup.add(cactusGroup);
            this.cactiGroup.add(cactusCopy);
            this.cacti.push(cactusGroup, cactusCopy);
        }
    }

    setupRocks() {
        this.rocksGroup = new THREE.Group();
        this.groundGroup.add(this.rocksGroup);
        const rockGeo = new THREE.DodecahedronGeometry(1, 0);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: '#a1887f', 
            flatShading: true,
            roughness: 0.9 
        });

        for(let i=0; i<40; i++) {
            const rock = new THREE.Mesh(rockGeo, rockMat);
            const scale = 0.5 + Math.random() * 1.5;
            rock.scale.set(scale, scale * 0.8, scale);
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 20);
            const y = this.getTerrainHeight(x, z) + 3.5;
            
            rock.position.set(x, y - (scale * 0.2), z); // Embed slightly
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            
            const copy = rock.clone();
            copy.position.x += 160;
            this.rocksGroup.add(rock, copy);
        }
    }

    setupBushes() {
        this.bushesGroup = new THREE.Group();
        this.groundGroup.add(this.bushesGroup);
        const bushGeo = new THREE.IcosahedronGeometry(0.5, 0);
        const bushMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', flatShading: true });

        for(let i=0; i<25; i++) {
            const bush = new THREE.Group();
            const numPuffs = 2 + Math.floor(Math.random() * 3);
            for(let j=0; j<numPuffs; j++) {
                const puff = new THREE.Mesh(bushGeo, bushMat);
                puff.position.set(Math.random()-0.5, Math.random()*0.3, Math.random()-0.5);
                puff.scale.setScalar(0.5 + Math.random());
                bush.add(puff);
            }
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 15);
            bush.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            
            const copy = bush.clone();
            copy.position.x += 160;
            this.bushesGroup.add(bush, copy);
        }
    }

    setupSignposts() {
        this.signsGroup = new THREE.Group();
        this.groundGroup.add(this.signsGroup);
        
        const postGeo = new THREE.BoxGeometry(0.15, 2.5, 0.15);
        const boardGeo = new THREE.BoxGeometry(1.2, 0.5, 0.1);
        const woodMat = new THREE.MeshStandardMaterial({ color: '#5d4037', flatShading: true });

        for(let i=0; i<6; i++) {
            const sign = new THREE.Group();
            const post = new THREE.Mesh(postGeo, woodMat);
            sign.add(post);
            
            const board = new THREE.Mesh(boardGeo, woodMat);
            board.position.y = 0.8;
            board.rotation.z = (Math.random() - 0.5) * 0.2;
            sign.add(board);
            
            const x = (i * 30) - 70;
            const z = (i % 2 === 0 ? 3.5 : -3.5); // Near road edges
            sign.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            sign.rotation.y = (i % 2 === 0 ? -0.5 : 0.5);
            sign.rotation.z = (Math.random() - 0.5) * 0.1; // Weathered tilt
            
            const copy = sign.clone();
            copy.position.x += 160;
            this.signsGroup.add(sign, copy);
        }
    }

    setupTumbleweeds() {
        this.tumbles = [];
        this.tumblesGroup = new THREE.Group();
        this.groundGroup.add(this.tumblesGroup);
        
        const loader = new GLTFLoader();
        loader.load('/assets/models/tumbleweed.glb', (gltf) => {
            const model = gltf.scene;
            
            // Optimize model
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            for(let i=0; i<12; i++) {
                const tumble = model.clone();
                const x = (Math.random() * 160) - 80;
                // Place them near the road (Z between -3.5 and 3.5)
                const z = (Math.random() - 0.5) * 7; 
                
                const scale = 0.001 + Math.random() * 0.001;
                tumble.scale.set(scale, scale, scale);
                tumble.position.set(x, this.getTerrainHeight(x, z) + 3.5 + 0.5, z);
                
                tumble.userData = {
                    phase: Math.random() * Math.PI * 2,
                    rollSpeed: 3 + Math.random() * 4,
                    bounceHeight: 0.4 + Math.random() * 0.4,
                    zSpeed: (Math.random() - 0.5) * 0.1, // Added speed to cross the road
                    zRange: 30 // Range to wander before wrapping
                };
                
                const copy = tumble.clone();
                copy.position.x += 160;
                
                this.tumbles.push(tumble, copy);
                this.tumblesGroup.add(tumble, copy);
            }
        });
    }

    setupAdvancedFeatures() {
        this.featuresGroup = new THREE.Group();
        this.groundGroup.add(this.featuresGroup);

        // 1. Rock Formations (Buttes) - Layered distant features
        const butteMat = new THREE.MeshStandardMaterial({ 
            color: '#a1887f', // Warm reddish brown
            flatShading: true,
            roughness: 0.9
        });

        for(let i=0; i<6; i++) {
            const butteGroup = new THREE.Group();
            const numLayers = 3 + Math.floor(Math.random() * 2);
            for(let j=0; j<numLayers; j++) {
                const radius = (numLayers - j) * 4;
                const height = 4 + Math.random() * 3;
                const layerGeo = new THREE.CylinderGeometry(radius * 0.6, radius, height, 5 + Math.floor(Math.random() * 3));
                const layer = new THREE.Mesh(layerGeo, butteMat);
                layer.position.y = j * 4;
                layer.rotation.y = Math.random() * Math.PI;
                layer.castShadow = true;
                layer.receiveShadow = true;
                butteGroup.add(layer);
            }

            const x = (i * 30) - 70 + (Math.random() * 20);
            const z = (Math.random() > 0.5 ? 45 : -45); 
            const totalScale = 0.5 + Math.random() * 1.0;
            butteGroup.scale.set(totalScale, totalScale, totalScale);
            butteGroup.position.set(x, this.getTerrainHeight(x, z) + 3.5 - 1, z);
            
            const copy = butteGroup.clone();
            copy.position.x += 160;
            this.featuresGroup.add(butteGroup, copy);
        }

        // 2. Teepee Tents
        const tentMat = new THREE.MeshStandardMaterial({ color: '#d7ccc8', flatShading: true });
        const poleMat = new THREE.MeshStandardMaterial({ color: '#5d4037' });
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4);

        for(let i=0; i<3; i++) {
            const teepee = new THREE.Group();
            
            // Tent body - open cone
            const bodyGeo = new THREE.ConeGeometry(2, 2.5, 6, 1, true);
            const body = new THREE.Mesh(bodyGeo, tentMat);
            body.position.y = 1.25;
            body.castShadow = true;
            teepee.add(body);

            // Poles sticking out
            for(let p=0; p<6; p++) {
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.rotation.z = 0.4;
                pole.rotation.y = (p / 6) * Math.PI * 2;
                pole.position.y = 2.0;
                teepee.add(pole);
            }

            const x = (i * 50) - 50;
            const z = (i % 2 === 0 ? 12 : -12);
            teepee.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            teepee.rotation.y = Math.random() * Math.PI;
            
            const copy = teepee.clone();
            copy.position.x += 160;
            this.featuresGroup.add(teepee, copy);
        }

        // 3. Cow Skulls
        const skullMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', flatShading: true });
        for(let i=0; i<4; i++) {
            const skull = this.createCowSkull(skullMat);
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 4 : -4);
            skull.position.set(x, this.getTerrainHeight(x, z) + 3.4, z); // Slightly embedded
            skull.rotation.set(0.5, Math.random(), 0.2);
            skull.scale.setScalar(1.2);
            
            const copy = skull.clone();
            copy.position.x += 160;
            this.featuresGroup.add(skull, copy);
        }
    }

    createCowSkull(material) {
        const group = new THREE.Group();
        const headGeo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
        const head = new THREE.Mesh(headGeo, material);
        head.castShadow = true;
        group.add(head);

        const hornGeo = new THREE.CylinderGeometry(0.05, 0.02, 0.5);
        hornGeo.rotateZ(Math.PI/2);
        
        const hornL = new THREE.Mesh(hornGeo, material);
        hornL.position.set(0.3, 0.1, 0.1);
        hornL.rotation.y = 0.6;
        hornL.castShadow = true;
        group.add(hornL);

        const hornR = hornL.clone();
        hornR.position.x = -0.3;
        hornR.rotation.y = -0.6;
        group.add(hornR);

        return group;
    }

    setupRoadDebris() {
        this.debrisGroup = new THREE.Group();
        this.groundGroup.add(this.debrisGroup);
        
        // 1. Small edge stones (sỏi đá ven đường)
        const stoneGeo = new THREE.DodecahedronGeometry(0.15, 0);
        const stoneMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', flatShading: true });
        
        for(let i=0; i<60; i++) {
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            const x = (Math.random() * 160) - 80;
            const side = Math.random() > 0.5 ? 1 : -1;
            const z = side * (3.0 + Math.random() * 0.8);
            const scale = 0.3 + Math.random() * 1.2;
            
            stone.scale.set(scale, scale * 0.6, scale);
            stone.position.set(x, this.getTerrainHeight(x, z) + 3.5 - 0.05, z);
            stone.rotation.set(Math.random(), Math.random(), Math.random());
            
            const copy = stone.clone();
            copy.position.x += 160;
            this.debrisGroup.add(stone, copy);
        }

        // 2. Dried Cracked Mud / Planks (Gỗ vụn/mảnh rác trên đường)
        const woodMat = new THREE.MeshStandardMaterial({ color: '#5d4037', flatShading: true });
        
        for(let i=0; i<10; i++) {
            const plankGrp = new THREE.Group();
            
            const numPieces = 1 + Math.floor(Math.random() * 3);
            for(let p=0; p<numPieces; p++) {
                const plankGeo = new THREE.BoxGeometry(0.6 + Math.random(), 0.08, 0.2 + Math.random()*0.2);
                const plank = new THREE.Mesh(plankGeo, woodMat);
                plank.position.set((Math.random()-0.5)*1, 0, (Math.random()-0.5)*1);
                plank.rotation.y = Math.random() * Math.PI;
                plank.rotation.z = (Math.random()-0.5)*0.1;
                plankGrp.add(plank);
            }
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() - 0.5) * 1.8; 
            plankGrp.position.set(x, this.getTerrainHeight(x, z) + 3.5, z); 
            
            const copy = plankGrp.clone();
            copy.position.x += 160;
            this.debrisGroup.add(plankGrp, copy);
        }
    }

    setupDeadTrees() {
        this.treesGroup = new THREE.Group();
        this.groundGroup.add(this.treesGroup);
        
        const barkMat = new THREE.MeshStandardMaterial({ color: '#4e342e', flatShading: true });
        
        // Use a recursive function to generate fractal-like branching trees
        const generateBranch = (radius, length, depth) => {
            const branchGroup = new THREE.Group();
            
            // The segment geometry
            const geo = new THREE.CylinderGeometry(radius * 0.6, radius, length, 5 - depth);
            geo.translate(0, length / 2, 0); // Origin at bottom of branch
            const mesh = new THREE.Mesh(geo, barkMat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            branchGroup.add(mesh);
            
            if (depth > 0) {
                const numSubBranches = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < numSubBranches; i++) {
                    const subRadius = radius * 0.6;
                    const subLength = length * (0.6 + Math.random() * 0.3);
                    const subBranch = generateBranch(subRadius, subLength, depth - 1);
                    
                    // Attach somewhere along the upper half of the current branch
                    subBranch.position.y = length * (0.5 + Math.random() * 0.5);
                    
                    // Angle outwards
                    subBranch.rotation.z = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.6);
                    subBranch.rotation.x = (Math.random() - 0.5) * 0.8;
                    subBranch.rotation.y = Math.random() * Math.PI * 2;
                    
                    branchGroup.add(subBranch);
                }
            }
            return branchGroup;
        };
        
        for(let i = 0; i < 20; i++) {
            const tree = generateBranch(0.15 + Math.random() * 0.1, 1.5 + Math.random() * 1.5, 2);
            
            const x = (Math.random() * 160) - 80;
            const z = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 25);
            tree.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.rotation.z = (Math.random() - 0.5) * 0.2; // Slight global tilt
            
            const copy = tree.clone();
            copy.position.x += 160;
            this.treesGroup.add(tree, copy);
        }
    }

    setupBeetles() {
        this.beetles = [];
        const bodyGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
        const ballGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const ballMat = new THREE.MeshStandardMaterial({ color: '#4e342e' });

        for(let i=0; i<5; i++) {
            const group = new THREE.Group();
            const beetle = new THREE.Mesh(bodyGeo, bodyMat);
            beetle.position.z = 0.3;
            group.add(beetle);
            const ball = new THREE.Mesh(ballGeo, ballMat);
            group.add(ball);

            const x = (Math.random() * 160) - 80;
            const z = (Math.random() - 0.5) * 10;
            group.position.set(x, -3.5, z);
            
            group.userData = {
                originalX: x,
                zSpeed: (Math.random() - 0.5) * 0.05,
                phase: Math.random() * Math.PI * 2
            };

            const copy = group.clone();
            copy.position.x += 160;
            this.groundGroup.add(group, copy);
            this.beetles.push(group, copy);
        }
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
                
                // Update 3D Background and Fog smoothly
                const cleanColor = part.theme.backgroundColor.substring(0, 7);
                const targetColor = new THREE.Color(cleanColor);
                
                gsap.to(this.scene.background, {
                    r: targetColor.r,
                    g: targetColor.g,
                    b: targetColor.b,
                    duration: 1.2,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        if (this.scene.fog) {
                            this.scene.fog.color.copy(this.scene.background);
                        }
                    }
                });

                // Update Celestial Body - toggle Sun vs Moon
                const celestialData = part.theme.celestial;
                if (this.celestialBody && celestialData) {
                    const isNightCelestial = celestialData.type === 'moon';

                    // Toggle between detailed moon and sun
                    if (this.sunGroup) this.sunGroup.visible = !isNightCelestial;
                    if (this.moonGroup) this.moonGroup.visible = isNightCelestial;

                    // Scale the whole celestial group
                    gsap.to(this.celestialBody.scale, {
                        x: celestialData.scale,
                        y: celestialData.scale,
                        z: celestialData.scale,
                        duration: 2.0,
                        ease: "elastic.out(1, 0.7)"
                    });
                }

                // Update Stars visibility based on night/day
                const isNight = celestialData.type === 'moon';
                if (this.starsMat) {
                    gsap.to(this.starsMat, {
                        opacity: isNight ? 0.7 : 0,
                        duration: 3.0,
                        ease: "power2.inOut"
                    });
                }
                if (this.mwMat) {
                    gsap.to(this.mwMat, {
                        opacity: isNight ? 0.7 : 0,
                        duration: 3.0,
                        ease: "power2.inOut"
                    });
                }

                // Smoothly transition Cloud colors
                if (this.cloudMat) {
                    const targetCloudColor = new THREE.Color(isNight ? '#1a237e' : '#ffffff');
                    const targetEmissive = new THREE.Color(isNight ? '#3949ab' : '#000000');
                    
                    gsap.to(this.cloudMat.color, {
                        r: targetCloudColor.r,
                        g: targetCloudColor.g,
                        b: targetCloudColor.b,
                        duration: 2.5
                    });
                    gsap.to(this.cloudMat.emissive, {
                        r: targetEmissive.r,
                        g: targetEmissive.g,
                        b: targetEmissive.b,
                        duration: 2.5
                    });
                }
                if (this.galaxyCoreLight) {
                    gsap.to(this.galaxyCoreLight, {
                        intensity: isNight ? 10 : 0,
                        duration: 3.0
                    });
                }

                // Update Daytime Elements visibility
                const skyElementsOpacity = isNight ? 0 : 1;
                this.rays.forEach(ray => {
                    gsap.to(ray.material, { opacity: isNight ? 0 : 0.08, duration: 2.0 });
                });
                this.paperPlanes.forEach(plane => {
                    gsap.to(plane.scale, { x: skyElementsOpacity, y: skyElementsOpacity, z: skyElementsOpacity, duration: 1.5 });
                });
                this.balloons.forEach(balloon => {
                    gsap.to(balloon.scale, { x: skyElementsOpacity, y: skyElementsOpacity, z: skyElementsOpacity, duration: 2.0 });
                });

                // Update Ground Tint
                if (this.ground1 && part.theme.groundColor) {
                    const tint = new THREE.Color(part.theme.groundColor);
                    gsap.to(this.ground1.material.color, {
                        r: tint.r,
                        g: tint.g,
                        b: tint.b,
                        duration: 2.0
                    });
                }

                content.classList.add('visible');
            }, 800);
        }

        this.updateNav();
    }

        // --- Setup Camels ---
    setupCamels() {
        this.camels = [];
        this.camelsGroup = new THREE.Group();
        this.groundGroup.add(this.camelsGroup); // Attach to ground for parallax scrolling

        // HÀM TẠO LẠC ĐÀ (từ camel.html)
        const createCamel = (type) => {
            const group = new THREE.Group();
            let config = {
                color: 0xD2B48C,
                scale: 1,
                humps: 2,
                bodyScale: [2, 1.3, 1.2],
                neckLen: 1.2,
                legH: 1.5
            };

            if (type === 'TANK') {
                config = { color: 0x8B5A2B, scale: 1.3, humps: 1, bodyScale: [2.2, 1.5, 1.5], neckLen: 1.4, legH: 1.6 };
            } else if (type === 'BABY') {
                config = { color: 0xE6C291, scale: 0.6, humps: 2, bodyScale: [1.8, 1.2, 1.1], neckLen: 1.0, legH: 0.9 };
            } else if (type === 'SNOW') {
                config = { color: 0xF5F5F5, scale: 1, humps: 2, bodyScale: [2, 1.4, 1.3], neckLen: 0.8, legH: 1.3 };
            }

            const mat = new THREE.MeshStandardMaterial({ color: config.color, flatShading: true, roughness: 0.8 });

            // Thân
            const body = new THREE.Mesh(new THREE.BoxGeometry(...config.bodyScale), mat);
            body.castShadow = true;
            group.add(body);

            // Bướu
            if (config.humps === 1) {
                const h = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 0.8, 6), mat);
                h.position.y = config.bodyScale[1]/2 + 0.3;
                h.castShadow = true;
                group.add(h);
            } else {
                [-0.4, 0.4].forEach(x => {
                    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 0.6, 6), mat);
                    h.position.set(x, config.bodyScale[1]/2 + 0.2, 0);
                    h.castShadow = true;
                    group.add(h);
                });
            }

            // Cổ & Đầu
            const neckGroup = new THREE.Group();
            const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, config.neckLen, 0.5), mat);
            neck.position.set(config.bodyScale[0]/2 + 0.2, 0.5, 0);
            neck.rotation.z = -Math.PI / 4;
            neck.castShadow = true;
            neckGroup.add(neck);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), mat);
            head.position.set(config.bodyScale[0]/2 + 0.7, 1.1, 0);
            head.castShadow = true;
            neckGroup.add(head);
            group.add(neckGroup);

            // Chân
            const legGeom = new THREE.BoxGeometry(0.2, config.legH, 0.2);
            const legs = [];
            const positions = [[0.7, 0.4], [0.7, -0.4], [-0.7, 0.4], [-0.7, -0.4]];
            positions.forEach(p => {
                const leg = new THREE.Mesh(legGeom, mat);
                // Adjust position based on leg half height and body half height
                leg.position.set(p[0], -config.bodyScale[1]/2 - config.legH/2 + 0.2, p[1]);
                leg.castShadow = true;
                group.add(leg);
                legs.push(leg);
            });

            group.scale.set(config.scale, config.scale, config.scale);
            
            // Trả về object chứa cả group và các bộ phận cần animation
            return { mesh: group, legs, neckGroup, type, config };
        };

        // Create the herd with variants and randomized placement
        const camelVariants = ['TANK', 'BABY', 'SNOW'];
        const numCamels = 12; // More camels
        
        for (let i = 0; i < numCamels; i++) {
            const type = camelVariants[Math.floor(Math.random() * camelVariants.length)];
            const cData = createCamel(type);
            const camel = cData.mesh;
            
            const x = (Math.random() * 160) - 80; 
            
            // Randomize Z: Some on road, some on hills, some far away
            let z;
            const rand = Math.random();
            if (rand < 0.2) { 
                // Close to or on road
                z = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 2);
            } else if (rand < 0.6) {
                // Background hills
                z = -12 - Math.random() * 20;
            } else {
                // Foreground / Side hills
                z = 12 + Math.random() * 15;
            }

            const lowestPoint = (cData.config.bodyScale[1]/2 + cData.config.legH/2 - 0.2) * cData.config.scale; 
            const groundY = this.getTerrainHeight(x, z) + 3.5;
            
            camel.position.set(x, groundY + lowestPoint, z); 
            // Random face direction
            camel.rotation.y = Math.random() * Math.PI * 2; 
            
            cData.baseY = groundY + lowestPoint; 
            cData.phase = Math.random() * Math.PI * 2; 

            this.camelsGroup.add(camel);
            this.camels.push(cData);

            // Add duplicate for wrapping
            const copyData = createCamel(type);
            const copyCamel = copyData.mesh;
            copyCamel.position.copy(camel.position);
            copyCamel.position.x += 160;
            copyCamel.rotation.y = camel.rotation.y;
            copyData.baseY = cData.baseY;
            copyData.phase = cData.phase;
            
            this.camelsGroup.add(copyCamel);
            this.camels.push(copyData);
        }
    }

    createSignboard(text, scale = 1) {
        const group = new THREE.Group();
        
        // Side Posts - Lengthened to ensure they bury into the ground
        const postSpacing = 0.9 * scale;
        const postHeight = 6 * scale; // Doubled height to reach into terrain
        const postGeo = new THREE.BoxGeometry(0.15 * scale, postHeight, 0.15 * scale);
        const postMat = new THREE.MeshStandardMaterial({ color: '#3e2723' });
        
        const postL = new THREE.Mesh(postGeo, postMat);
        postL.position.set(-postSpacing, postHeight * 0.5 - 1.0 * scale, -0.1 * scale);
        postL.castShadow = true;
        group.add(postL);
        
        const postR = new THREE.Mesh(postGeo, postMat);
        postR.position.set(postSpacing, postHeight * 0.5 - 1.0 * scale, -0.1 * scale);
        postR.castShadow = true;
        group.add(postR);
        
        // Board
        const boardGeo = new THREE.BoxGeometry(2.5 * scale, 1.2 * scale, 0.12 * scale);
        const boardMat = new THREE.MeshStandardMaterial({ color: '#4e342e' });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 3.5 * scale; // Adjusted position relative to longer posts
        board.castShadow = true;
        group.add(board);
        
        // Canvas Text - MUCH higher resolution for giant billboards
        const canvas = document.createElement('canvas');
        canvas.width = 2048; 
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(0, 0, 2048, 1024);

        // Wood grain
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 30;
        for(let i=0; i<20; i++) {
            ctx.beginPath();ctx.moveTo(0, i*60);ctx.lineTo(2048, i*60 + (Math.random()-0.5)*80);ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        // Auto-scale font based on text length to fill the billboard
        const fontSize = Math.floor(250); 
        ctx.font = `bold ${fontSize}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText(text, 1024, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16; // Sharper at angles
        const labelGeo = new THREE.PlaneGeometry(2.4 * scale, 1.1 * scale);
        const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const label = new THREE.Mesh(labelGeo, labelMat);
        // MATCH the board Y position (3.5 * scale)
        label.position.set(0, 3.5 * scale, 0.09 * scale); 
        group.add(label);
        
        return group;
    }

    setupStartSign() {
        // Massive Giant Billboard (12x Size)
        const giantSign = this.createSignboard("HUYEN'S CHRONICLES", 12);
        const x = 30; // Further ahead
        const z = -25; // Deep on the hills
        // Grounded: use a smaller offset because createSignboard internal positions 
        // already lift the board, but we need the posts TO TOUCH the ground.
        giantSign.position.set(x, this.getTerrainHeight(x, z) + 1.0, z);
        
        // Rotate slightly to face the path
        giantSign.rotation.y = -Math.PI * 0.1;
        
        this.ground1.add(giantSign);
    }

    setupMilestones() {
        const milestones = [
            { text: "JS CITY - 5 MI", x: -40, z: -4 },
            { text: "2021: START", x: 0, z: 4 },
            { text: "CREATIVITY - ∞", x: 40, z: -4.2 }
        ];

        milestones.forEach(m => {
            const sign = this.createSignboard(m.text, 1);
            sign.position.set(m.x, this.getTerrainHeight(m.x, m.z) + 3.5, m.z);
            if (m.z > 0) sign.rotation.y = Math.PI;
            
            const copy = sign.clone();
            copy.position.x += 160;
            this.groundGroup.add(sign, copy);
        });
    }

    setupRoadsideBuildings() {
        const createTeaStall = () => {
            const group = new THREE.Group();
            
            // Stall Hut (Bamboo/Thatch look)
            const booth = new THREE.Mesh(new THREE.BoxGeometry(3, 3.5, 2), new THREE.MeshStandardMaterial({ color: '#8d6e63' }));
            booth.position.y = 0.75; // Lengthened downwards
            group.add(booth);
            
            const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 2.5, 1, 4), new THREE.MeshStandardMaterial({ color: '#5d4037' }));
            roof.position.y = 3;
            roof.rotation.y = Math.PI / 4;
            group.add(roof);
            
            // Sign (Trà Đá)
            const sign = this.createSignboard("TRÀ ĐÁ 2K", 0.6);
            sign.position.set(1.8, 1, 1);
            group.add(sign);
            
            // Legendary Blue Plastic Chairs (Small cubes)
            const chairMat = new THREE.MeshStandardMaterial({ color: '#2196f3' });
            for(let i=0; i<4; i++) {
                const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), chairMat);
                chair.position.set((Math.random()-0.5)*3, 0.2, 2.5 + Math.random()*1);
                group.add(chair);
            }
            
            return group;
        };

        const createPhoShop = () => {
            const group = new THREE.Group();
            
            // Typical Yellow Vietnamese House
            const building = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 4), new THREE.MeshStandardMaterial({ color: '#fbc02d' }));
            building.position.y = 1; // Foundation deep
            group.add(building);
            
            // Red Roof
            const roof = new THREE.Mesh(new THREE.CylinderGeometry(0, 5, 2, 4), new THREE.MeshStandardMaterial({ color: '#c62828' }));
            roof.position.y = 5;
            roof.rotation.y = Math.PI / 4;
            group.add(roof);
            
            // Big Sign
            const sign = this.createSignboard("PHỞ GIA TRUYỀN", 1.2);
            sign.position.set(0, 4, 2.5);
            group.add(sign);
            
            return group;
        };

        const createAHACafe = () => {
            const group = new THREE.Group();
            
            // AHA Style (Dark wood/Green accents)
            const building = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 5), new THREE.MeshStandardMaterial({ color: '#2b2b2b' }));
            building.position.y = 1.5; // Deep foundation
            group.add(building);
            
            const accent = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.8, 5.2), new THREE.MeshStandardMaterial({ color: '#2e7d32' }));
            accent.position.y = 4;
            group.add(accent);
            
            const sign = this.createSignboard("AHA CAFE", 1.8);
            sign.position.set(0, 5.5, 3);
            group.add(sign);
            
            // Outdoor seating
            const woodMat = new THREE.MeshStandardMaterial({ color: '#4e342e' });
            for(let i=0; i<3; i++) {
                const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 12), woodMat);
                table.position.set(-3 + i*3, 0.8, 4.5);
                group.add(table);
            }
            
            return group;
        };

        const createCowboyBar = () => {
            const group = new THREE.Group();
            
            // Materials from bar.html
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, flatShading: true });
            const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });

            // 1. Main Structure (lengthened downwards for foundation)
            const mainWall = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 4), woodMat);
            mainWall.position.y = 2; // Sinks 2 units below pivot
            mainWall.castShadow = true;
            group.add(mainWall);

            // 2. High Sign (False Front)
            const falseFront = new THREE.Mesh(new THREE.BoxGeometry(8.2, 2, 0.5), woodMat);
            falseFront.position.set(0, 7, 2);
            group.add(falseFront);

            // 3. Porch Roof
            const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.2, 3), woodMat);
            porchRoof.position.set(0, 4.5, 3.5);
            porchRoof.rotation.x = 0.1;
            group.add(porchRoof);

            // 4. Porch Floor
            const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 3), floorMat);
            porchFloor.position.set(0, 0.15, 3.5);
            porchFloor.receiveShadow = true;
            group.add(porchFloor);

            // 5. Pillars
            const pillarGeo = new THREE.BoxGeometry(0.2, 4.5, 0.2);
            const p1 = new THREE.Mesh(pillarGeo, woodMat); p1.position.set(-3.8, 2.25, 4.8); group.add(p1);
            const p2 = new THREE.Mesh(pillarGeo, woodMat); p2.position.set(3.8, 2.25, 4.8); group.add(p2);
            const p3 = new THREE.Mesh(pillarGeo, woodMat); p3.position.set(0, 2.25, 4.8); group.add(p3);

            // 6. Batwing Doors
            const doorGroup = new THREE.Group();
            const doorGeo = new THREE.BoxGeometry(1.2, 1.8, 0.1);
            const leftDoor = new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({color: 0x3e2723}));
            leftDoor.position.set(-0.65, 0, 0);
            const rightDoor = new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({color: 0x3e2723}));
            rightDoor.position.set(0.65, 0, 0);
            doorGroup.add(leftDoor, rightDoor);
            doorGroup.position.set(0, 1.5, 2.1);
            group.add(doorGroup);
            group.userData.batwingDoors = doorGroup; // For animation

            // 7. Railings
            const railGeo = new THREE.BoxGeometry(3.5, 0.1, 0.1);
            const r1 = new THREE.Mesh(railGeo, woodMat); r1.position.set(-2, 1, 4.8); group.add(r1);
            const r2 = new THREE.Mesh(railGeo, woodMat); r2.position.set(2, 1, 4.8); group.add(r2);
            
            // SALOON Sign
            const sign = this.createSignboard("SALOON BAR", 1.8);
            sign.position.set(0, 7.5, 2.2);
            group.add(sign);
            
            return group;
        };

        // Placement - Pulled close to the road (z = -6) to stay on the "roadside"
        const locations = [
            { build: createCowboyBar, x: 15, z: -7 },
            { build: createTeaStall, x: 50, z: -6 },
            { build: createPhoShop, x: 90, z: -6.5 },
            { build: createAHACafe, x: 130, z: -7 }
        ];

        locations.forEach(loc => {
            const building = loc.build();
            building.position.set(loc.x, this.getTerrainHeight(loc.x, loc.z) + 3.5, loc.z);
            
            // Buildings should face +Z (the road) if no rotation. 
            // My models are built with front at +Z. No rotation needed to face camera/road.
            building.rotation.y = 0; 
            
            const copy = building.clone();
            copy.position.x += 160;
            this.groundGroup.add(building, copy);
            
            // Register for animation if needed
            if (building.userData.batwingDoors) {
                this.roadsideProps.push({
                    mesh: building.userData.batwingDoors,
                    type: 'batwing'
                });
                // Also for the copy
                copy.traverse(child => {
                    if (child.isGroup && child.children.length === 2 && child.position.z > 2) {
                        this.roadsideProps.push({ mesh: child, type: 'batwing' });
                    }
                });
            }
        });
    }



    // --- Procedural Textures for Pyramid ---
    createPyramidTextures() {
        if (this.pyramidTextures) return this.pyramidTextures;
        
        const size = 512;
        
        // 1. Diffuse (Golden Yellow)
        const dCanvas = document.createElement('canvas');
        dCanvas.width = size; dCanvas.height = size;
        const dCtx = dCanvas.getContext('2d');
        dCtx.fillStyle = '#daa520'; 
        dCtx.fillRect(0, 0, size, size);
        const colors = ['#b8860b', '#cd853f', '#f0e68c', '#bdb76b'];
        for(let i=0; i<2000; i++) {
            dCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            dCtx.globalAlpha = Math.random() * 0.4;
            dCtx.fillRect(Math.random()*size, Math.random()*size, Math.random()*5+1, Math.random()*5+1);
        }
        const diffuse = new THREE.CanvasTexture(dCanvas);
        diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
        diffuse.repeat.set(2, 2);

        // 2. Roughness (Stone feel)
        const rCanvas = document.createElement('canvas');
        rCanvas.width = size; rCanvas.height = size;
        const rCtx = rCanvas.getContext('2d');
        rCtx.fillStyle = '#888888'; 
        rCtx.fillRect(0, 0, size, size);
        rCtx.globalCompositeOperation = 'lighter';
        for(let i=0; i<5000; i++) {
            const gray = Math.floor(Math.random() * 255);
            rCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            rCtx.fillRect(Math.random()*size, Math.random()*size, Math.random()*2+0.5, Math.random()*2+0.5);
        }
        const roughness = new THREE.CanvasTexture(rCanvas);
        roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
        roughness.repeat.set(2, 2);

        // 3. Normal (Bumpy Surface)
        const nCanvas = document.createElement('canvas');
        nCanvas.width = size; nCanvas.height = size;
        const nCtx = nCanvas.getContext('2d');
        nCtx.fillStyle = '#8080ff'; 
        nCtx.fillRect(0, 0, size, size);
        for(let i=0; i<size*size*0.1; i++) { // Optimization: only partial noise
            const r = 128 + (Math.random() - 0.5) * 40;
            const g = 128 + (Math.random() - 0.5) * 40;
            nCtx.fillStyle = `rgb(${r}, ${g}, 255)`;
            nCtx.fillRect(Math.random()*size, Math.random()*size, 1, 1);
        }
        const normal = new THREE.CanvasTexture(nCanvas);
        normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
        normal.repeat.set(2, 2);

        this.pyramidTextures = { diffuse, roughness, normal };
        return this.pyramidTextures;
    }

    createPyramid(scale = 1) {
        const tex = this.createPyramidTextures();
        const pyramidGeo = new THREE.ConeGeometry(8 * scale, 12 * scale, 4);
        const pyramidMat = new THREE.MeshStandardMaterial({ 
            map: tex.diffuse,
            roughnessMap: tex.roughness,
            normalMap: tex.normal,
            normalScale: new THREE.Vector2(1.5, 1.5),
            metalness: 0.1,
            roughness: 0.9
        });

        const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
        pyramid.castShadow = true;
        pyramid.receiveShadow = true;
        pyramid.position.y = 6 * scale;
        return pyramid;
    }

    setupPyramids() {
        const scale = 2.5; // Final scale = 15x compared to defaults (8*2.5 = 20 radius, 12*2.5 = 30 height)
        const x = 115;
        const z = -45; // Place it deep in the background for scale

        const pyramid = this.createPyramid(scale);
        pyramid.position.set(x, this.getTerrainHeight(x, z) + 0.1, z);
        pyramid.rotation.y = Math.PI / 4; // Standard alignment
        
        const copy = pyramid.clone();
        copy.position.x += 160;
        
        this.groundGroup.add(pyramid, copy);
    }

    setupNightGod() {
        // Second Deity (City Mom Model) - Appears in the Night/Frozen part
        const x = 110; 
        const z = -55; // Pushed far back behind the mountains
        const baseY = this.getTerrainHeight(x, z);

        const loader = new GLTFLoader();
        // DEBUG: Adding a bright marker to see where it *should* be
        const debugMarker = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
        );
        debugMarker.position.set(x, this.getTerrainHeight(x, z) + 5, z);
        this.groundGroup.add(debugMarker);

        loader.load('/assets/models/new_ciity_mom.glb', (gltf) => {
            console.log('Night God Loaded successfully');
            const model = gltf.scene;
            
            // Significant scale for visibility
            model.scale.set(2, 2, 2); 
            
            const godGroup = new THREE.Group();
            godGroup.renderOrder = 5;
            
            // Center the model
            model.position.y = 0; 
            godGroup.add(model);
            
            const finalZ = -30; // Closer than mountains
            godGroup.position.set(45, this.getTerrainHeight(45, finalZ), finalZ);
            godGroup.rotation.y = Math.PI * 0.5; // Look at road

            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const copy = godGroup.clone();
            copy.position.x += 160;
            this.groundGroup.add(godGroup, copy);

            // Remove debug marker once loaded
            this.groundGroup.remove(debugMarker);

            // Animation Registration
            this.roadsideProps.push({ mesh: godGroup, type: 'god', baseY: godGroup.position.y });
            this.roadsideProps.push({ mesh: copy, type: 'god', baseY: godGroup.position.y });
        }, undefined, (error) => {
            console.error('CRITICAL: Night God model failed to load. Check path: /assets/models/new_ciity_mom.glb', error);
        });
    }

    setupWarGod() {
        // Massive War God (Knight Model)
        const x = 70; 
        const z = -25; 
        const baseY = this.getTerrainHeight(x, z) + 0.5;

        const loader = new GLTFLoader();
        loader.load('/assets/models/bulky_knight.glb', (gltf) => {
            const model = gltf.scene;
            
            // The model is "very big", so we scale it down to fit our world
            // 0.05 is usually a good starting point for "monumental" size if it's huge
            model.scale.set(0.02, 0.02, 0.02); 
            
            const godGroup = new THREE.Group();
            godGroup.renderOrder = 5;
            
            // Pedestal for the Knight
            const foundationMat = new THREE.MeshStandardMaterial({ color: '#3d2b1f', flatShading: true });
            const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(15, 20, 20, 6), foundationMat);
            pedestal.position.y = 0;
            godGroup.add(pedestal);

            model.position.y = 10; // Sit on pedestal
            godGroup.add(model);
            
            godGroup.position.set(x, baseY, z);
            godGroup.rotation.y = -Math.PI * 0.1;

            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            const copy = godGroup.clone();
            copy.position.x += 160;
            this.groundGroup.add(godGroup, copy);

            // Animation Registration
            this.roadsideProps.push({ mesh: godGroup, type: 'god', baseY: godGroup.position.y });
            this.roadsideProps.push({ mesh: copy, type: 'god', baseY: godGroup.position.y });
        });
    }

    setupRelics() {
        const createSkull = () => {
            const skull = new THREE.Group();
            const boneMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, flatShading: true });
            
            const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), boneMat);
            cranium.position.y = 0.8;
            cranium.scale.set(1, 1.1, 1);
            skull.add(cranium);
            
            const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), boneMat);
            jaw.position.set(0, 0.2, 0.2);
            skull.add(jaw);
            
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), eyeMat);
            eye.position.set(-0.3, 0.8, 0.55);
            skull.add(eye);
            const eye2 = eye.clone();
            eye2.position.x = 0.3;
            skull.add(eye2);
            
            return skull;
        };

        // Add Skull
        const skull = createSkull();
        // Move skull closer and scale up for impact
        skull.position.set(-20, this.getTerrainHeight(-20, 5) + 3.2, 5);
        skull.rotation.set(-0.2, Math.PI / 4, 0);
        skull.scale.set(1.5, 1.5, 1.5);
        
        const skullCopy = skull.clone();
        skullCopy.position.x += 160;
        this.groundGroup.add(skull, skullCopy);

        // Add Giant Camera body
        const cameraGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 2), new THREE.MeshStandardMaterial({ color: '#333' }));
        body.position.y = 1.25;
        cameraGroup.add(body);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12), new THREE.MeshStandardMaterial({ color: '#222' }));
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 1.25, 1.25);
        cameraGroup.add(lens);
        
        cameraGroup.position.set(25, this.getTerrainHeight(25, -5.5) + 3.0, -5.5);
        cameraGroup.rotation.y = -Math.PI / 6;
        
        const camCopy = cameraGroup.clone();
        camCopy.position.x += 160;
        this.groundGroup.add(cameraGroup, camCopy);
    }

    setupFuelStation() {
        const createStation = () => {
            const group = new THREE.Group();
            
            // 1. Concrete Platform (Slab)
            const platformGeo = new THREE.BoxGeometry(10, 0.4, 6);
            const platformMat = new THREE.MeshStandardMaterial({ color: '#555' });
            const platform = new THREE.Mesh(platformGeo, platformMat);
            platform.receiveShadow = true;
            group.add(platform);

            // 2. Main Building
            const buildingGeo = new THREE.BoxGeometry(5, 4, 3.5);
            const buildingMat = new THREE.MeshStandardMaterial({ color: '#2c3e50', flatShading: true });
            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.position.set(-2, 2, -1);
            building.castShadow = true;
            group.add(building);

            // 3. Large Window (Glowing at night)
            const windowGeo = new THREE.PlaneGeometry(2.5, 1.8);
            const windowMat = new THREE.MeshStandardMaterial({ 
                color: '#f1c40f', 
                emissive: '#f1c40f', 
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            const win = new THREE.Mesh(windowGeo, windowMat);
            win.position.set(-1.8, 2.2, 0.76);
            group.add(win);

            // 4. Fuel Pumps
            const createPump = (x) => {
                const pumpGroup = new THREE.Group();
                const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.6), new THREE.MeshStandardMaterial({ color: '#e74c3c' }));
                pBody.position.y = 0.9;
                pumpGroup.add(pBody);
                
                const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshBasicMaterial({ color: '#00ff00' }));
                pScreen.position.set(0, 1.3, 0.31);
                pumpGroup.add(pScreen);
                
                pumpGroup.position.set(x, 0.2, 1.5);
                return pumpGroup;
            };
            group.add(createPump(1.5), createPump(3.5));

            // 5. Roof Overhang
            const roofGeo = new THREE.BoxGeometry(10.5, 0.3, 7);
            const roof = new THREE.Mesh(roofGeo, buildingMat);
            roof.position.set(0, 4.2, 0.5);
            group.add(roof);

            // 6. Vertical Neon Pole
            const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 7);
            const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: '#333' }));
            pole.position.set(4, 3.5, 2.5);
            group.add(pole);

            const signGeo = new THREE.BoxGeometry(2, 1.2, 0.2);
            const signMat = new THREE.MeshStandardMaterial({ 
                color: '#e67e22', 
                emissive: '#e67e22', 
                emissiveIntensity: 2 
            });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(4, 6, 2.5);
            group.add(sign);

            // Light from the station
            const light = new THREE.PointLight('#f1c40f', 5, 20);
            light.position.set(0, 3, 3);
            group.add(light);

            return group;
        };

        const station = createStation();
        const x = -75;
        const z = -6.0; // Pushed right up against the road edge (road is ~3 wide)
        station.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
        
        const copy = station.clone();
        copy.position.x += 160;
        this.groundGroup.add(station, copy);
    }

    setupPowerLines() {
        const createPole = () => {
            const group = new THREE.Group();
            const poleMat = new THREE.MeshStandardMaterial({ color: '#3d2b1f' });
            
            // Main Pole
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 8), poleMat);
            pole.position.y = 4;
            group.add(pole);
            
            // Crossbeams
            const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.2), poleMat);
            beam.position.y = 7;
            group.add(beam);
            
            const beam2 = beam.clone();
            beam2.position.y = 6;
            group.add(beam2);
            
            return group;
        };

        for(let i = 0; i < 8; i++) {
            const pole = createPole();
            const x = (i * 20) - 80;
            const z = -5.5; // Always on the same side for cable logic feel
            pole.position.set(x, this.getTerrainHeight(x, z) + 3.5, z);
            
            const copy = pole.clone();
            copy.position.x += 160;
            this.groundGroup.add(pole, copy);
        }
    }

    setupSmallDetails() {
        const createMailbox = () => {
            const group = new THREE.Group();
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: '#444' }));
            post.position.y = 0.6;
            group.add(post);
            
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.8), new THREE.MeshStandardMaterial({ color: '#c0392b' }));
            box.position.y = 1.3;
            group.add(box);
            
            return group;
        };

        const details = [
            { type: 'mailbox', x: -10, z: 4 },
            { type: 'mailbox', x: 55, z: -4.5 },
            { type: 'barrel', x: -50, z: -4.2 },
            { type: 'barrel', x: -52, z: -3.8 }
        ];

        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ color: '#7f8c8d' });

        details.forEach(d => {
            let obj;
            if (d.type === 'mailbox') {
                obj = createMailbox();
                if (d.z < 0) obj.rotation.y = Math.PI;
            } else {
                obj = new THREE.Mesh(barrelGeo, barrelMat);
                obj.position.y = 0.6;
            }
            
            obj.position.set(d.x, this.getTerrainHeight(d.x, d.z) + 3.5, d.z);
            
            const copy = obj.clone();
            copy.position.x += 160;
            this.groundGroup.add(obj, copy);
        });
    }

    setupMusic() {
        this.musicPlaying = false;
        this.playerReady = false;
        const toggleBtn = document.getElementById('music-toggle');
        
        // Define global callback for YT API
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube API Script Loaded');
            this.player = new YT.Player('youtube-player', {
                height: '0',
                width: '0',
                videoId: 'Uv2ljVv96e8',
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'iv_load_policy': 3,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'loop': 1,
                    'playlist': 'Uv2ljVv96e8'
                },
                events: {
                    'onReady': () => {
                        this.playerReady = true;
                        console.log('YouTube Player Ready');
                        
                        // Try to autoplay (might be blocked by browser)
                        this.player.playVideo();
                        
                        // If it started playing, update UI
                        setTimeout(() => {
                            if (this.player.getPlayerState() === 1) { // 1 = Playing
                                this.musicPlaying = true;
                                if (toggleBtn) toggleBtn.classList.add('playing');
                            }
                        }, 1000);
                    },
                    'onStateChange': (event) => {
                        if (event.data === YT.PlayerState.ENDED) {
                            this.player.playVideo();
                        }
                    }
                }
            });
        };

        // Dynamically load the YouTube API script to ensure callback is defined first
        if (!document.getElementById('yt-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-api-script';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else if (window.YT && window.YT.Player) {
            // If already loaded somehow, trigger manually
            window.onYouTubeIframeAPIReady();
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (!this.playerReady) {
                    console.log('Player not ready yet...');
                    return;
                }

                if (this.musicPlaying) {
                    this.player.pauseVideo();
                    toggleBtn.classList.remove('playing');
                    toggleBtn.title = "Play Music";
                } else {
                    this.player.playVideo();
                    toggleBtn.classList.add('playing');
                    toggleBtn.title = "Pause Music";
                }
                this.musicPlaying = !this.musicPlaying;
            });
        }
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

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('click', () => {
            if (this.hoveredObject) {
                this.showCarCard();
            }
        });

        // UI Events
        const carCard = document.getElementById('car-card');
        const closeBtn = document.querySelector('.card-close');
        if (closeBtn && carCard) {
            closeBtn.addEventListener('click', () => {
                carCard.classList.remove('visible');
            });
        }
    }

    showCarCard() {
        const carCard = document.getElementById('car-card');
        if (carCard) {
            carCard.style.display = 'block';
            setTimeout(() => carCard.classList.add('visible'), 10);
        }
    }

    syncPartToProgress() {
        const total = 4.0; // 4 Stages
        const progress = this.targetScrollProgress % total;
        const normalized = progress < 0 ? total + progress : progress;
        
        let bestIndex = Math.floor(normalized);
        if (bestIndex > 3) bestIndex = 3;

        if (bestIndex !== this.currentPartIndex) {
            this.goToPart(bestIndex);
        }
    }

    update() {
        const elapsedTime = performance.now() * 0.001;

        // Calculate scroll velocity
        const diff = (this.targetScrollProgress - this.scrollProgress);
        const velocity = diff * 0.08;
        this.scrollProgress += velocity;

        // --- Animate the Ground ---
        if (this.groundGroup) {
            // Move ground left as car goes right (opposite of scroll velocity)
            let groundX = this.groundGroup.position.x;
            groundX -= velocity * 60; // 60 is the world parallax speed for background
            
            // Endless loop wrap logic (width = 160)
            groundX = groundX % 160;
            if (groundX > 0) groundX -= 160;
            
            this.groundGroup.position.x = groundX;
        }

        // --- Animate the Clouds ---
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                cloud.position.x -= cloud.userData.speed;
                // Subtle floating motion
                cloud.position.y += Math.sin(elapsedTime * 0.5 + cloud.position.x) * 0.005;
                
                // Wrap around when moving off screen to the left
                if (cloud.position.x < -60) {
                    cloud.position.x = 60;
                }
            });
        }

        // --- Animate the Celestial Body (Cinematic Arc) ---
        if (this.celestialBody) {
            const totalRange = 4.0; 
            const progress = this.scrollProgress % totalRange; 
            const normalized = progress < 0 ? totalRange + progress : progress;
            
            let isInsideArc = false;
            let relProgress = 0;
            let currentCel = null;

            // Divide 4.0 range into 4 equal 1.0 slots with small buffers
            const stage = Math.floor(normalized);
            const stageProgress = normalized - stage;
            
            if (stageProgress >= 0.1 && stageProgress <= 0.9) {
                isInsideArc = true;
                relProgress = (stageProgress - 0.1) / 0.8;
                currentCel = this.config.parts[stage].theme.celestial;
            }

            if (isInsideArc) {
                this.celestialBody.visible = true;
                const startPos = currentCel.pos;
                // Expanded distance horizontally for wide FOV and deep Z
                const travelDist = 300; 
                this.celestialBody.position.x = (startPos.x - 130) + travelDist * relProgress;
                const arcHeight = 55; // Raised arc height for deep Z 
                this.celestialBody.position.y = startPos.y + Math.sin(relProgress * Math.PI) * arcHeight;
                this.celestialBody.position.z = startPos.z;
            } else {
                this.celestialBody.visible = false;
                this.celestialBody.position.y = -20; 
            }

            // Update God Rays position to match Celestial Body
            if (this.rayGroup) {
                this.rayGroup.position.copy(this.celestialBody.position);
                // Rays only visible when sun is up (not moon or hidden)
                this.rayGroup.visible = (isInsideArc && currentCel.type === 'sun');
                this.rayGroup.rotation.y += 0.005;
            }

            // Stars Twinkle & Milky Way drift
            if (this.starsMat && this.starsMat.opacity > 0) {
                this.starsMat.size = 0.08 + Math.sin(elapsedTime * 3) * 0.02;
                
                // Shooting stars logic
                this.shootingStars.forEach(ss => {
                    if (ss.active) {
                        ss.mesh.position.add(ss.velocity);
                        ss.life -= 0.015; // Speed of fading
                        
                        // Fade in and out
                        if (ss.life > 0.8) {
                            ss.mesh.material.opacity = (1 - ss.life) * 5; 
                        } else if (ss.life < 0.2) {
                            ss.mesh.material.opacity = ss.life * 5;
                        } else {
                            ss.mesh.material.opacity = 1;
                        }
                        
                        if (ss.life <= 0) ss.active = false;
                        
                    } else {
                        // Randomly spawn new shooting star (only if night)
                        if (Math.random() < 0.003) { // Rare spawn rate
                            ss.active = true;
                            ss.life = 1.0;
                            
                            // Random start position high in the sky
                            ss.mesh.position.set(
                                (Math.random() - 0.5) * 120, // Wide spawn map
                                25 + Math.random() * 20,
                                -30 - Math.random() * 30
                            );
                            
                            // Velocity vector (falling diagonally)
                            ss.velocity.set(
                                -0.5 - Math.random() * 0.8, // Move left very fast
                                -0.3 - Math.random() * 0.4, // Moving down
                                (Math.random() - 0.5) * 0.4 // Slight Z curve
                            );
                            
                            // Scale length of the mesh depending on total speed
                            const speed = ss.velocity.length();
                            ss.mesh.scale.set(1, 1, speed * 2);

                            // Align cylinder to velocity 
                            ss.mesh.lookAt(
                                ss.mesh.position.x + ss.velocity.x,
                                ss.mesh.position.y + ss.velocity.y,
                                ss.mesh.position.z + ss.velocity.z
                            );
                        }
                    }
                });
            } else {
                // If daytime, force hide any lingering shooting stars
                if (this.shootingStars) {
                    this.shootingStars.forEach(ss => {
                        ss.mesh.material.opacity = 0;
                        ss.active = false;
                    });
                }
            }
        }

        // --- Animate Milky Way ---
        if (this.milkyWay) {
            this.milkyWay.rotation.y = elapsedTime * 0.02;
            if (this.mwMat && this.starsMat && this.starsMat.opacity > 0) {
                 this.milkyWay.rotation.z = Math.sin(elapsedTime * 0.1) * 0.02;
            }
        }
        if (this.galaxyCoreLight && this.currentPartIndex === 1) {
            // Pulse the intensity at night
            const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.2;
            this.galaxyCoreLight.intensity = 10 * pulse;
        }

        // --- Animate Extra Elements ---
        this.paperPlanes.forEach(plane => {
            plane.position.x -= plane.userData.speed;
            
            // Banking / Wobble animation (sliding through air)
            plane.rotation.z = Math.sin(elapsedTime * 2 + plane.userData.phase) * 0.2;
            plane.rotation.y = Math.PI + Math.sin(elapsedTime * 1 + plane.userData.phase) * 0.1;
            
            // Subtle height variation
            plane.position.y += Math.sin(elapsedTime * 1.5 + plane.userData.phase) * 0.005;

            if (plane.position.x < -60) plane.position.x = 60;
        });

        this.balloons.forEach(balloon => {
            balloon.position.y += Math.sin(elapsedTime * 0.5) * 0.01;
            balloon.rotation.z = Math.sin(elapsedTime * 0.3) * 0.05;
        });

        // --- Animate the Cacti (Wobble only) ---
        this.cacti.forEach((cactus, index) => {
            // Subtle wind sway (based on index for variety)
            cactus.rotation.x = Math.sin(elapsedTime * 1.5 + index) * 0.03;
            cactus.rotation.z = Math.cos(elapsedTime * 1.8 + index) * 0.03;
        });

        // --- Animate Tumbleweeds ---
        this.tumbles.forEach(t => {
            t.rotation.z -= t.userData.rollSpeed * 0.05;
            t.rotation.x += t.userData.rollSpeed * 0.02;

            // Move across the road (Z axis)
            t.position.z += t.userData.zSpeed;
            
            // Wrap Z position so they stay within visibility
            if (t.position.z > t.userData.zRange) t.position.z = -t.userData.zRange;
            if (t.position.z < -t.userData.zRange) t.position.z = t.userData.zRange;

            // Bouncing motion
            const bounce = Math.abs(Math.sin(elapsedTime * t.userData.rollSpeed + t.userData.phase)) * t.userData.bounceHeight;
            // Recalculate Y based on new X and Z
            t.position.y = this.getTerrainHeight(t.position.x, t.position.z) + 3.5 + 0.6 + bounce;
        });

        // --- Animate Beetles ---
        this.beetles.forEach(b => {
            b.position.z += b.userData.zSpeed;
            if (b.position.z > 15) b.position.z = -15;
            if (b.position.z < -15) b.position.z = 15;
            b.position.y = this.getTerrainHeight(b.position.x, b.position.z) + 3.5 + 0.1;
            // Wobble beetle
            b.children[0].position.y = Math.sin(elapsedTime * 10 + b.userData.phase) * 0.05;
            // Roll ball
            b.children[1].rotation.x += 0.1;
        });

        // --- Animate Camels ---
        this.camels.forEach((c) => {
            const { mesh, legs, neckGroup, type, phase, baseY } = c;
            
            // 1. Nhấp nhô thân
            const walkSpeed = type === 'BABY' ? 3 : 1.5;
            mesh.position.y = baseY + Math.sin(elapsedTime * walkSpeed + phase) * 0.1;

            // 2. Gật gù cổ
            neckGroup.rotation.z = Math.sin(elapsedTime * walkSpeed + phase) * 0.05;

            // 3. Đung đưa chân (giả lập đang đi nhẹ)
            legs.forEach((leg, i) => {
                const offset = (i % 2 === 0) ? 0 : Math.PI;
                leg.rotation.z = Math.sin(elapsedTime * walkSpeed + phase + offset) * 0.2;
            });
        });

        // --- Animate the Car ---
        if (this.carGroup) {
            // Wheels spin proportional to speed
            const wheelSpinSpeed = velocity * 150;
            this.carWheels.forEach(wheel => {
                wheel.rotation.z -= wheelSpinSpeed;
            });
            
            // Suspension: car body slightly bounces based on speed
            const bounce = Math.abs(Math.sin(elapsedTime * 20)) * Math.abs(velocity) * 1.5;
            this.carBody.position.y = bounce; // Applied to sub-group
            this.carRoof.position.y = bounce; 

            // Chassis tilts backwards on acceleration, forwards on deceleration/reverse
            const targetTilt = velocity * 8; 
            // Smoothly interpolate the tilt
            this.carGroup.rotation.z += (targetTilt - this.carGroup.rotation.z) * 0.1;
        }

        // --- Animate Roadside Props ---
        this.roadsideProps.forEach(prop => {
            if (prop.type === 'batwing') {
                prop.mesh.rotation.y = Math.sin(elapsedTime * 4.0) * 0.15;
            }
            if (prop.type === 'god') {
                prop.mesh.position.y = prop.baseY + Math.sin(elapsedTime * 2.0) * 0.5;
            }
            if (prop.type === 'spear') {
                prop.mesh.rotation.z = Math.sin(elapsedTime * 1.5) * 0.05;
            }
        });

        // Advance GLB built-in animations (smoke/exhaust/etc.)
        if (this.carMixer) {
            const deltaTime = 1 / 60; // ~60fps delta
            this.carMixer.update(deltaTime);
        }

        // (Assets section removed as we are using cacti)
        this.assets.length = 0; 

        // --- Handle Interaction (Raycasting) ---
        if (this.raycaster && this.mouse) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactableObjects);

            if (intersects.length > 0) {
                const hitObject = intersects[0].object;
                document.body.style.cursor = 'pointer';
                
                // If it's a car part, show the WHITE BORDER
                if (hitObject.userData.isCarPart) {
                    this.hoveredObject = 'car';
                    this.carBody.traverse(child => {
                        if (child.userData.outline) {
                            child.userData.outline.visible = true;
                        }
                    });
                }
            } else {
                if (this.hoveredObject === 'car') {
                    // Hide WHITE BORDER
                    this.carBody.traverse(child => {
                        if (child.userData.outline) {
                            child.userData.outline.visible = false;
                        }
                    });
                }
                this.hoveredObject = null;
                document.body.style.cursor = 'default';
            }
        }

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(() => this.update());
    }
}
