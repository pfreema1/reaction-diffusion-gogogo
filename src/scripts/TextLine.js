import * as THREE from 'three';

export default class TextLine {
    constructor(
        startX,
        startY,
        snippetWidth,
        snippetPadding,
        scrollSpeed,
        scrollDir,
        ctx,
        fontSize,
        textString
    ) {
        this.snippets = [
            {
                x: startX,
                y: startY
            },
            {
                x: startX + (snippetWidth + snippetPadding) * 1,
                y: startY
            },
            {
                x: startX + (snippetWidth + snippetPadding) * 2,
                y: startY
            }
        ];

        this.scrollSpeed = scrollSpeed;
        this.scrollDir = scrollDir;
        this.snippetWidth = snippetWidth;
        this.snippetPadding = snippetPadding;

        this.ctx = ctx;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.fontSize = fontSize;
        this.textString = textString;

        this.rotationTime = 2;
    }

    returnFirstSnippet() {
        let firstSnippet = null;

        firstSnippet = this.snippets.reduce((accum, currVal) => {
            return accum.x < currVal.x ? accum : currVal;
        });

        return firstSnippet;
    }

    returnLastSnippet() {
        let lastSnippet = null;

        // case: we going left
        lastSnippet = this.snippets.reduce((accum, currVal) => {
            return accum.x > currVal.x ? accum : currVal;
        });

        return lastSnippet;
    }

    checkLastSnippet() {
        const firstSnippet = this.returnFirstSnippet();
        const lastSnippet = this.returnLastSnippet();
        const totalSnippetWidth = this.snippetWidth + this.snippetPadding;

        // if lastSnippet is offscreen
        if (this.scrollDir < 0) {
            // case: going left
            if (firstSnippet.x + totalSnippetWidth < 0) {
                //case:  the farthest left snippet is off screen, move it to the end
                firstSnippet.x = lastSnippet.x + totalSnippetWidth;
            }
        } else {
            // case: going right
            if (lastSnippet.x - totalSnippetWidth > this.width) {
                // case:  the farthest right snippet is off screen, move it to the beginning
                lastSnippet.x = firstSnippet.x - totalSnippetWidth;
            }
        }
    }

    update(time) {
        for (let i = 0; i < this.snippets.length; i++) {
            this.snippets[i].x += this.scrollSpeed * this.scrollDir;
        }

        this.checkLastSnippet();
    }

    draw(time) {
        // this.ctx.translate(this.width * 0.5, this.height * 0.5);
        // this.ctx.rotate(Math.sin(time * 5.0) * 0.001);
        // this.ctx.translate(0, 0);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // this.ctx.rotate(Math.PI / 180);
        // this.ctx.save();
        // this.ctx.restore();

        for (let i = 0; i < this.snippets.length; i++) {
            this.ctx.font = this.fontSize + 'px Oswald';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.textString,
                this.snippets[i].x,
                this.snippets[i].y
            );
        }
    }
}
