/**********************
 * 
 *  lots of this code came from here: https://github.com/pmneila/jsexp
 *  excellent explanation of the gray-scott model here: http://www.karlsims.com/rd.html
 */

import * as THREE from 'three';
import glslify from 'glslify';
import genericVert from '../shaders/generic.vert';
import gsFrag from '../shaders/gs.frag';
import screenFrag from '../shaders/screen.frag';

export default class RD {
    constructor(bgScene, bgCamera, renderer) {
        this.bgScene = bgScene;
        this.bgCamera = bgCamera;
        this.renderer = renderer;
        this.mMinusOnes = new THREE.Vector2(-1, -1);
        this.mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
        this.mCamera.position.z = 100;
        this.mScene = new THREE.Scene();
        this.mScene.add(this.mCamera);
        this.mToggled = false;
        this.width = 640;//window.innerWidth;
        this.height = 480;//window.innerHeight;
        this.iterations = 8;

        this.feed = 0.037;
        this.kill = 0.06;
        this.diffRateA = 0.2097;
        this.diffRateB = 0.105;


        // this.feed = 0.025;
        // this.kill = 0.062;
        // this.diffRateA = 0.3;
        // this.diffRateB = 0.1;


        this.initMouseMoveListen();

        this.mUniforms = {
            screenWidth: { type: "f", value: this.width },
            screenHeight: { type: "f", value: this.height },
            tSource: { type: "t", value: undefined },
            delta: { type: "f", value: 1.0 },
            feed: { type: "f", value: this.feed },
            kill: { type: "f", value: this.kill },
            diffRateA: { type: 'f', value: undefined },
            diffRateB: { type: 'f', value: undefined },
            brush: { type: "v2", value: new THREE.Vector2(-10, -10) },
            color1: { type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0) },
            color2: { type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2) },
            color3: { type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21) },
            color4: { type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4) },
            color5: { type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6) },
            invert: { type: 'f', value: 1.0 },
            // brushSize: { type: 'f', value: undefined },
            uTime: { type: 'f', value: undefined }
        }

        this.mGSMaterial = new THREE.ShaderMaterial({
            uniforms: this.mUniforms,
            vertexShader: glslify(genericVert),
            fragmentShader: glslify(gsFrag)
        });

        this.mScreenMaterial = new THREE.ShaderMaterial({
            uniforms: this.mUniforms,
            vertexShader: glslify(genericVert),
            fragmentShader: glslify(screenFrag)
        });

        const plane = new THREE.PlaneGeometry(1.0, 1.0);
        this.mScreenQuad = new THREE.Mesh(plane, this.mScreenMaterial);
        // this.bgScene.add(this.mScreenQuad);
        this.mScene.add(this.mScreenQuad);

        this.mColorsNeedUpdate = true;

        this.resize(this.width, this.height);

        this.render(0);

        this.mUniforms.brush.value = new THREE.Vector2(0.5, 0.5);
        this.mLastTime = new Date().getTime();

        requestAnimationFrame(this.render.bind(this));

    }

    initMouseMoveListen() {
        this.mouse = new THREE.Vector2();
        // this.width = window.innerWidth;
        // this.height = window.innerHeight;

        window.addEventListener('mousemove', ({ clientX, clientY }) => {
            this.mouse.x = clientX; //(clientX / this.width) * 2 - 1;
            this.mouse.y = clientY; //-(clientY / this.height) * 2 + 1;

        });
    }

    setupCamera() {
        this.mCamera.aspect = this.width / this.height;
        this.mCamera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    resize(width, height) {
        this.setupCamera();

        this.mTexture1 = new THREE.WebGLRenderTarget(width, height,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType
            });
        this.mTexture2 = new THREE.WebGLRenderTarget(width, height,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType
            });
        this.mTexture1.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.mTexture1.texture.wrapT = THREE.ClampToEdgeWrapping;
        this.mTexture2.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.mTexture2.texture.wrapT = THREE.ClampToEdgeWrapping;

        this.mUniforms.screenWidth.value = width;
        this.mUniforms.screenHeight.value = height;
    }

    render(time) {
        let dt = (time - this.mLastTime) / 20.0;
        if (dt > 0.8 || dt <= 0)
            dt = 0.8;
        this.mLastTime = time;

        this.mScreenQuad.material = this.mGSMaterial;


        this.mUniforms.delta.value = dt;
        // this.mUniforms.feed.value = this.feed;
        this.mUniforms.feed.value = THREE.Math.mapLinear(Math.sin(time * 0.0005), -1, 1, 0.026, 0.083);
        // this.mUniforms.brushSize.value = THREE.Math.mapLinear(Math.sin(time * 0.0005), -1, 1, 5, 10000);
        this.mUniforms.kill.value = this.kill;
        this.mUniforms.diffRateA.value = this.diffRateA;
        this.mUniforms.diffRateB.value = this.diffRateB;
        this.mUniforms.uTime.value = time;

        for (let i = 0; i < this.iterations; ++i) {
            if (!this.mToggled) {
                this.mUniforms.tSource.value = this.mTexture1.texture;
                this.renderer.setRenderTarget(this.mTexture2);
                this.renderer.render(this.mScene, this.mCamera);
                this.renderer.setRenderTarget(null);
                this.mUniforms.tSource.value = this.mTexture2.texture;
            } else {
                this.mUniforms.tSource.value = this.mTexture2.texture;
                this.renderer.setRenderTarget(this.mTexture1);
                this.renderer.render(this.mScene, this.mCamera);
                this.renderer.setRenderTarget(null);
                this.mUniforms.tSource.value = this.mTexture1.texture;
            }

            this.mToggled = !this.mToggled;

            this.mUniforms.brush.value = this.mMinusOnes;
        }

        if (this.mouse) {
            this.mUniforms.brush.value = new THREE.Vector2(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
        }

        this.mScreenQuad.material = this.mScreenMaterial;
        this.mScreenQuad.material.needsUpdate = true;
        this.renderer.render(this.mScene, this.mCamera);

        requestAnimationFrame(this.render.bind(this));
    }
}