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
        this.feed = 0.037;
        this.kill = 0.06;
        this.mMinusOnes = new THREE.Vector2(-1, -1);
        this.mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
        this.mCamera.position.z = 100;
        this.mScene = new THREE.Scene();
        this.mScene.add(this.mCamera);
        this.mToggled = false;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.mUniforms = {
            screenWidth: { type: "f", value: window.innerWidth },
            screenHeight: { type: "f", value: window.innerHeight },
            tSource: { type: "t", value: undefined },
            delta: { type: "f", value: 1.0 },
            feed: { type: "f", value: this.feed },
            kill: { type: "f", value: this.kill },
            brush: { type: "v2", value: new THREE.Vector2(0.7, 0.7) },
            color1: { type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0) },
            color2: { type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2) },
            color3: { type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21) },
            color4: { type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4) },
            color5: { type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6) }
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

        this.resize(window.innerWidth, window.innerHeight);

        this.render(0);

        this.mUniforms.brush.value = new THREE.Vector2(0.7, 0.7);
        this.mLastTime = new Date().getTime();

        // requestAnimationFrame(this.render.bind(this));

    }

    setupCamera() {
        this.mCamera.aspect = window.innerWidth / window.innerHeight;
        this.mCamera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
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

    render(time, mouse) {
        let dt = (time - this.mLastTime) / 20.0;
        if (dt > 0.8 || dt <= 0)
            dt = 0.8;
        this.mLastTime = time;

        this.mScreenQuad.material = this.mGSMaterial;


        this.mUniforms.delta.value = dt;
        this.mUniforms.feed.value = this.feed;
        this.mUniforms.kill.value = this.kill;

        // for (let i = 0; i < 8; ++i) {
        //     if (!this.mToggled) {
        //         this.mUniforms.tSource.value = this.mTexture1.texture;
        //         this.renderer.setRenderTarget(this.mTexture2);
        //         this.renderer.render(this.mScene, this.mCamera);
        //         this.renderer.setRenderTarget(null);
        //         this.mUniforms.tSource.value = this.mTexture2.texture;
        //     } else {
        //         this.mUniforms.tSource.value = this.mTexture2.texture;
        //         this.renderer.setRenderTarget(this.mTexture1);
        //         this.renderer.render(this.mScene, this.mCamera);
        //         this.renderer.setRenderTarget(null);
        //         this.mUniforms.tSource.value = this.mTexture1.texture;
        //     }

        //     this.mToggled = !this.mToggled;

        //     // this.mUniforms.brush.value = this.mMinusOnes;
        // }

        this.mUniforms.tSource.value = this.mTexture1.texture;
        this.renderer.setRenderTarget(this.mTexture2);
        this.renderer.render(this.mScene, this.mCamera);
        this.renderer.setRenderTarget(null);
        this.mUniforms.tSource.value = this.mTexture2.texture;
        this.renderer.setRenderTarget(this.mTexture1);
        this.renderer.render(this.mScene, this.mCamera);
        this.renderer.setRenderTarget(null);
        this.mUniforms.tSource.value = this.mTexture1.texture;


        if (mouse) {
            this.mUniforms.brush.value = new THREE.Vector2(mouse.x / this.width, 1 - mouse.y / this.height);
        }

        this.mScreenQuad.material = this.mScreenMaterial;
        this.mScreenQuad.material.needsUpdate = true;
        // this.renderer.render(this.mScene, this.mCamera);
    }
}