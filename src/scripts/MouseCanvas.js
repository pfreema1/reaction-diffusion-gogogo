import * as THREE from 'three';
import { easeOutQuad, easeInOutQuad, easeOutSine, easeInOutSine } from './utils/easing.utils';


export default class MouseCanvas {
    constructor() {
        this.maxAge = 120;
        this.radius = 30;
        this.trail = [];


        this.initTexture();
    }

    initTexture() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width = window.innerWidth;
        this.canvas.height = this.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.texture = new THREE.Texture(this.canvas);
        this.texture.minFilter = THREE.LinearFilter;

        this.canvas.id = 'canvasTexture';
        this.canvas.style.width = this.canvas.style.height = `${this.canvas.width}px`;
    }

    update(delta) {
        this.clear();

        // age points
        this.trail.forEach((point, i) => {
            point.age++;
            // remove old
            if (point.age > this.maxAge) {
                this.trail.splice(i, 1);
            }
        });


        this.trail.forEach((point, i) => {
            this.drawTouch(point);
        });

        this.texture.needsUpdate = true;

    }

    clear() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addTouch(point) {
        let force = 0;
        const last = this.trail[this.trail.length - 1];

        if (last) {
            const dx = last.x - point.x;
            const dy = last.y - point.y;
            const dd = dx * dx + dy * dy;
            force = Math.min(dd * 10000, 1);
        }

        this.trail.push({ x: point.x, y: point.y, age: 0, force });
    }

    drawTouch(point) {
        const pos = {
            x: point.x,
            y: point.y
        };

        let intensity = 1;

        if (point.age < this.maxAge * 0.3) {
            intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1);
        } else {
            intensity = easeOutSine(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1);
        }

        intensity *= point.force;

        const radius = this.radius * intensity;//this.size * this.radius * intensity;
        const grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);
        grd.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        grd.addColorStop(1, `rgba(0, 0, 0, 0.0)`);

        this.ctx.beginPath();
        this.ctx.fillStyle = grd;
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

}