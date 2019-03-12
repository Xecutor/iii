import { Pos, Rect } from './utils';
import * as gr from './graphics';
import { idleColor, impulseColor, impactColor } from './colors';

export const tileSize = 32;
const tileGlowSize = 1;
const tileExtraSize = 4;
export const tileFullSize = tileSize + (tileGlowSize + tileExtraSize) * 2;
const cacheCanvasWidth = 2048;
const cacheCanvasHeight = 2048;

//Draw Primitives
enum DP {
    begin,
    lineWidth,
    line,
    arc,
    stroke
}

function scos(a:number)
{
    return Math.cos(a*Math.PI)
}

function ssin(a:number)
{
    return Math.sin(a*Math.PI)
}

class FrameInfo {
    outerRect: Rect = new Rect(0, 0, tileFullSize, tileFullSize);
    innerRect: Rect = new Rect(0, 0, tileSize, tileSize);
    setInfo(innerPos: Pos) {
        this.innerRect.pos.assign(innerPos);
        this.outerRect.pos.assign(innerPos).sub(tileGlowSize + tileExtraSize, tileGlowSize + tileExtraSize);

    }
}

class CacheRecord {
    frames = new Array<FrameInfo>();
    addFrame(pos: Pos) {
        let f = new FrameInfo();
        f.setInfo(pos);
        this.frames.push(f);
    }
}

function genHWaves(fig1: Array<number>, fig2: Array<number>, frame: number, start: number, end: number) {
    for (let x = start; x <= end; x += 0.1) {
        fig1.push(x);
        fig1.push(0.25 + (Math.sin((x + 2 * frame / 25) * Math.PI) + 1) / 4);
        fig2.push(x);
        fig2.push(0.25 + (Math.cos((x + 0.5 + 2 * frame / 25) * Math.PI) + 1) / 4);
    }
}
function genVWaves(fig1: Array<number>, fig2: Array<number>, frame: number, start: number, end: number) {
    for (let x = start; x <= end; x += 0.05) {
        fig1.push(0.25 + (Math.sin((x + 2 * frame / 25) * Math.PI) + 1) / 4);
        fig1.push(x);
        fig2.push(0.25 + (Math.cos((x + 0.5 + 2 * frame / 25) * Math.PI) + 1) / 4);
        fig2.push(x);
    }
}

function genSparks(fa: Array<Array<number>>, frame: number) {
    for (let i = 0; i < 16; ++i) {
        let r1 = (((frame + i * 25 / 16) % 25) / 25) * 0.25;
        let r2 = r1 + 0.1;
        if (r2 > 0.25) r2 = 0.25;
        let dx = Math.cos(i * Math.PI / 8);
        let dy = Math.sin(i * Math.PI / 8);
        const cx = 0.5;
        const cy = 0.5;
        fa.push([DP.line, cx + r1 * dx, cy + r1 * dy, cx + r2 * dx, cy + r2 * dy]);
    }
}

function reverseByPairs(arr: Array<number>, start: number = 1) {
    let l = arr.length;
    let mx = (l - start) / 2;
    for (let idx = 0; idx < mx; idx += 2) {
        let x = arr[start + idx];
        let y = arr[start + idx + 1];
        arr[start + idx] = arr[l - idx - 2];
        arr[start + idx + 1] = arr[l - idx - 1];
        arr[l - idx - 2] = x;
        arr[l - idx - 1] = y;
    }
}


export class TileManager {
    static instance = new TileManager();
    cacheCanvas: HTMLCanvasElement = document.createElement('canvas');
    cache: { [key: string]: CacheRecord } = {}

    cacheLastIdx: number = 0;

    ctx: CanvasRenderingContext2D;
    lastPos: Pos;


    constructor() {
        this.prepare();
    }
    private getNextCachePos() {
        let idx = this.cacheLastIdx++;
        const tilesPerRow = (cacheCanvasWidth / tileFullSize) | 0;
        let y = ((idx / tilesPerRow) | 0) * tileFullSize;
        let x = (idx % tilesPerRow) * tileFullSize;
        this.lastPos = new Pos(x + tileGlowSize + tileExtraSize, y + tileGlowSize + tileExtraSize);
        return this.lastPos;
    }
    private getCacheRecord(name: string) {
        if (name in this.cache) {
            return this.cache[name];
        }
        else {
            let rv = new CacheRecord();
            this.cache[name] = rv;
            return rv;
        }
    }
    private drawPrimitive(pa: Array<number>) {
        switch (pa[0]) {
            case DP.begin: {
                this.ctx.beginPath();
            } break;
            case DP.lineWidth: {
                this.ctx.lineWidth = pa[1];
            } break;
            case DP.line: {
                let x0 = this.lastPos.x + pa[1] * tileSize;
                let y0 = this.lastPos.y + pa[2] * tileSize;
                this.ctx.moveTo(x0, y0);
                for (let idx = 3; idx < pa.length; idx += 2) {
                    let x1 = this.lastPos.x + pa[idx] * tileSize;
                    let y1 = this.lastPos.y + pa[idx + 1] * tileSize;
                    this.ctx.lineTo(x1, y1);
                }

            } break;
            case DP.arc: {
                let cx = this.lastPos.x + pa[1] * tileSize;
                let cy = this.lastPos.y + pa[2] * tileSize;
                let r = pa[3] * tileSize;
                let a1 = pa[4] * Math.PI;
                let a2 = pa[5] * Math.PI;
                let acw = pa[6] ? true : false;
                this.ctx.arc(cx, cy, r, a1, a2, acw);
            }
            case DP.stroke: {
                this.ctx.stroke();
            }
        }
    }
    private drawFigure(fig: Array<Array<number>>, repeat: number, addBeginStroke: boolean = true) {
        for (let pa of fig) {
            for (let i = 0; i < repeat; ++i) {
                if (addBeginStroke) this.drawPrimitive([DP.begin]);
                this.drawPrimitive(pa);
                if (addBeginStroke) this.drawPrimitive([DP.stroke]);
            }
        }
    }
    private prepare() {
        this.cacheCanvas.width = cacheCanvasWidth;
        this.cacheCanvas.height = cacheCanvasHeight;
        this.ctx = this.cacheCanvas.getContext('2d');
        let ctx = this.ctx;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        let r = this.getCacheRecord('tile-highlight');
        let pos = this.getNextCachePos();
        r.addFrame(pos);
        ctx.fillRect(pos.x, pos.y, tileSize, tileSize);

        ctx.lineWidth = 2;
        ctx.shadowBlur = tileGlowSize;

        this.genPlayer();

        ctx.shadowColor = 'cyan';
        ctx.strokeStyle = 'cyan';
        this.genMarker();
        //this.genConnection('my');
        this.genFeatures();
        this.genFloor();
        this.genDoors();
        this.genDirMarks()
        this.genStunEffect()
        this.genStairsDown()

        ctx.shadowColor = 'white';
        ctx.strokeStyle = 'white';
        this.genWalls();


        ctx.shadowColor = 'red';
        ctx.strokeStyle = 'red';

        this.genEnemies();

        const tilesPerRow = (cacheCanvasWidth / tileFullSize) | 0;
        const totalRows = (cacheCanvasHeight / tileFullSize) | 0;
        const totalTiles = tilesPerRow * totalRows;
        console.log(`cache:${this.cacheLastIdx}/${totalTiles} (%${100 * this.cacheLastIdx / totalTiles})`);
    }

    private genMarker() {
        let r = this.getCacheRecord('marker');
        for (let f = 0; f < 8; ++f) {
            r.addFrame(this.getNextCachePos());
            let fa: Array<Array<number>> = [];
            for (let i = 0; i < 4; ++i) {
                fa.push([DP.begin]);
                let arc = [DP.arc, 0.5, 0.5, 0.55];
                let sig = ((i & 1) * 2 - 1);
                let a1 = ((f / 8) * sig + (i & 2) / 2);
                let a2 = a1 + sig / 10;
                arc.push(a1, a2, sig > 0 ? 0 : 1);
                fa.push(arc, [DP.stroke]);
            }
            this.drawFigure(fa, 1, false);
        }
    }
    
    private genStunEffect() {
        let ctx = this.ctx
        ctx.shadowColor = 'white';
        ctx.strokeStyle = 'white';
        let r = this.getCacheRecord('stun-effect');
        let a = [ 0, 2.0/4.0, 4.0/4.0, 6.0/4.0]
        let delta = 0.15
        for (let f = 0; f < 20; ++f) {
            r.addFrame(this.getNextCachePos());
            for(let i=0;i<4;++i) {
                let x1 = 0.5+ssin(a[i])/2
                let x2 = 0.5+ssin(a[i]+delta)/2
                let y1 = 0.1+0.1*scos(a[i])/2
                let y2 = 0.1+0.1*scos(a[i]+delta)/2
                this.drawFigure([[DP.line, x1, y1, x2, y2]], 1)
                a[i]+=1.0/20
            }
        }
    }
    private genDirMarks() {
        let ctx = this.ctx
        ctx.shadowColor = 'lightgrey';
        ctx.strokeStyle = 'lightgrey';
        let r = this.getCacheRecord('dir-up');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([[DP.line, 0.25, 0.75, 0.5, 0.5, 0.75, 0.75]], 1)
        r = this.getCacheRecord('dir-down');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([[DP.line, 0.25, 0.25, 0.5, 0.5, 0.75, 0.25]], 1)    
        r = this.getCacheRecord('dir-left');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([[DP.line, 0.75, 0.25, 0.5, 0.5, 0.75, 0.75]], 1)    
        r = this.getCacheRecord('dir-right');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([[DP.line, 0.25, 0.25, 0.5, 0.5, 0.25, 0.75]], 1)    
    }

    private genFeatures() {
        this.ctx.lineWidth = 2;
        let r = this.getCacheRecord('connector');
        r.addFrame(this.getNextCachePos());
        let box = [DP.line, 0.1, 0.1, 0.9, 0.1, 0.9, 0.9, 0.1, 0.9, 0.1, 0.1];
        this.drawFigure([
            box,
            [DP.line, 0.25, 0.5, 0.5, 0.25, 0.75, 0.5, 0.5, 0.75, 0.25, 0.5]
        ], 1)

        r = this.getCacheRecord('data-box');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([
            box,
            [DP.line, 0.2, 0.3, 0.8, 0.3],
            [DP.line, 0.2, 0.5, 0.8, 0.5],
            [DP.line, 0.2, 0.7, 0.8, 0.7],
        ], 1)

        r = this.getCacheRecord('data-processor');
        for (let f = 0; f < 11; ++f) {
            r.addFrame(this.getNextCachePos());
            let x1 = 0.8 * (f > 4 ? 10 - f : f) / 5;
            let x2 = 0.8 - x1;
            this.drawFigure([
                box,
                [DP.line, 0.1 + x1, 0.1, 0.1 + x2, 0.9],
            ], 1)
        }
    }

    private genPlayer() {
        let ctx = this.ctx
        ctx.shadowColor = idleColor;
        ctx.strokeStyle = idleColor;
        let r = this.getCacheRecord('player-1');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([
            [DP.arc, 0.5, 0.5, 0.2, 0, 2],
            [DP.stroke],
            [DP.line, 0.7, 0.3, 0.7, 0.7],
            [DP.line, 0.7, 0.7, 0.92, 0.7],
            [DP.arc, 0.5, 0.5, 0.45, 0.12, 0.3, 1]
        ], 1);
        ctx.shadowColor = impulseColor;
        ctx.strokeStyle = impulseColor;
        r = this.getCacheRecord('player-2');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([
            [DP.arc, 0.5, 0.5, 0.2, 0, 2],
            [DP.stroke],
            [DP.line, 0.7, 0.3, 0.7, 0.7],
            [DP.line, 0.7, 0.7, 0.8, 0.7, 1, 0.5, 0.5, 0, 0, 0.5, 0.5, 1, 0.7, 0.8],
        ], 1);
        ctx.shadowColor = impactColor;
        ctx.strokeStyle = impactColor;
        r = this.getCacheRecord('player-3');
        r.addFrame(this.getNextCachePos());
        this.drawFigure([
            [DP.arc, 0.5, 0.5, 0.2, 0, 2],
            [DP.stroke],
            [DP.line, 0.7, 0.3, 0.7, 0.7],
            [DP.line, 0.7, 0.7, 0.85, 0.65, 0.80, 0.5, 1, 0, 0.5, 0.2, 0, 0, 0.2, 0.5, 0, 1, 0.5, 0.8, 1, 1, 0.9, 0.8],
        ], 1);
    }

    private genConnection(prefix: string) {
        const rep = 1;
        let r = this.getCacheRecord(prefix + '-connection-piece-lr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());
            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 1);
            this.drawFigure([fig1, fig2], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tb');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());
            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 1.1);
            this.drawFigure([fig1, fig2], rep);
        }
        let sq = [DP.line, 0.25, 0.25, 0.25, 0.75, 0.75, 0.75, 0.75, 0.25, 0.25, 0.25];
        r = this.getCacheRecord(prefix + '-connection-piece-bl');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(0, fig1[idx1 - 1]);
            fig2.push(0, fig2[idx2 - 1]);
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1] = fig1[idx1 + 2];
            fig2[idx2] = fig2[idx2 + 2];
            this.drawFigure([fig1, fig2, sq], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-br');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            reverseByPairs(fig1);
            reverseByPairs(fig2);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(0, fig1[idx1 - 1]);
            fig2.push(0, fig2[idx2 - 1]);
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1] = fig1[idx1 + 2];
            fig2[idx2] = fig2[idx2 + 2];
            this.drawFigure([fig1, fig2, sq], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tl');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0.0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(0, fig1[idx1 - 1]);
            fig2.push(0, fig2[idx2 - 1]);
            genVWaves(fig1, fig2, f, 0.0, 0.3);
            reverseByPairs(fig1, idx1 + 2);
            reverseByPairs(fig2, idx2 + 2);
            fig1[idx1] = fig1[idx1 + 2];
            fig2[idx2] = fig2[idx2 + 2];
            this.drawFigure([fig1, fig2, sq], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(fig1[idx1 - 2], 0);
            fig2.push(fig2[idx2 - 2], 0);
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1 + 1] = fig1[idx1 + 3];
            fig2[idx2 + 1] = fig2[idx2 + 3];
            this.drawFigure([fig1, fig2, sq], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tlr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            let x1 = fig1[idx1 - 2];
            let x2 = fig2[idx2 - 2];
            fig1.push(fig1[idx1 - 2], 0);
            fig2.push(fig2[idx2 - 2], 0);
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1 + 1] = fig1[idx1 + 3];
            fig2[idx2 + 1] = fig2[idx2 + 3];
            let y1 = fig1[idx1 + 3];
            let y2 = fig2[idx2 + 3]
            this.drawFigure([fig1, fig2, sq], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 0.3);
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            this.drawFigure([fig1, fig2], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-blr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(0, fig1[idx1 - 1]);
            fig2.push(0, fig2[idx2 - 1]);
            let y1 = fig1[idx1 - 1];
            let y2 = fig2[idx2 - 1];
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1] = fig1[idx1 + 2];
            fig2[idx2] = fig2[idx2 + 2];
            let x1 = fig1[idx1 + 2];
            let x2 = fig2[idx2 + 2];
            this.drawFigure([fig1, fig2, sq], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            this.drawFigure([fig1, fig2], rep);

        }
        r = this.getCacheRecord(prefix + '-connection-piece-tbl');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0.0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(0, fig1[idx1 - 1]);
            fig2.push(0, fig2[idx2 - 1]);
            let y1 = fig1[idx1 - 1];
            let y2 = fig2[idx2 - 1];
            genVWaves(fig1, fig2, f, 0.0, 0.3);
            reverseByPairs(fig1, idx1 + 2);
            reverseByPairs(fig2, idx2 + 2);
            fig1[idx1] = fig1[idx1 + 2];
            fig2[idx2] = fig2[idx2 + 2];
            let x1 = fig1[idx1 + 2];
            let x2 = fig2[idx2 + 2];
            this.drawFigure([fig1, fig2, sq], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            this.drawFigure([fig1, fig2], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tbr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(fig1[idx1 - 2], 0);
            fig2.push(fig2[idx2 - 2], 0);
            let x1 = fig1[idx1 - 2];
            let x2 = fig2[idx2 - 2];
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1 + 1] = fig1[idx1 + 3];
            fig2[idx2 + 1] = fig2[idx2 + 3];
            let y1 = fig1[idx1 + 3];
            let y2 = fig2[idx2 + 3]
            this.drawFigure([fig1, fig2, sq], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            this.drawFigure([fig1, fig2], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-tblr');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 0.3);
            let idx1 = fig1.length;
            let idx2 = fig2.length;
            fig1.push(fig1[idx1 - 2], 0);
            fig2.push(fig2[idx2 - 2], 0);
            let x1 = fig1[idx1 - 2];
            let x2 = fig2[idx2 - 2];
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            fig1[idx1 + 1] = fig1[idx1 + 3];
            fig2[idx2 + 1] = fig2[idx2 + 3];
            let y1 = fig1[idx1 + 3];
            let y2 = fig2[idx2 + 3]
            this.drawFigure([fig1, fig2, sq], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            this.drawFigure([fig1, fig2], rep);
            fig1 = [DP.line];
            fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 0.3);
            fig1.push(x1, y1);
            fig2.push(x2, y2);
            this.drawFigure([fig1, fig2], rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-t');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0, 0.3);
            let arc = [DP.arc, 0.5, 0.5, 0.3, 0, 2];
            let fa = [fig1, fig2, arc];
            genSparks(fa, f);
            this.drawFigure(fa, rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-b');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genVWaves(fig1, fig2, f, 0.7, 1.1);
            let arc = [DP.arc, 0.5, 0.5, 0.3, 0, 2];
            let fa = [fig1, fig2, arc];
            genSparks(fa, f);
            this.drawFigure(fa, rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-l');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0, 0.3);
            let arc = [DP.arc, 0.5, 0.5, 0.3, 0, 2];
            let fa = [fig1, fig2, arc];
            genSparks(fa, f);
            this.drawFigure(fa, rep);
        }
        r = this.getCacheRecord(prefix + '-connection-piece-r');
        for (let f = 0; f < 25; ++f) {
            r.addFrame(this.getNextCachePos());

            let fig1 = [DP.line];
            let fig2 = [DP.line];
            genHWaves(fig1, fig2, f, 0.7, 1.1);
            let arc = [DP.arc, 0.5, 0.5, 0.3, 0, 2];
            let fa = [fig1, fig2, arc];
            genSparks(fa, f);
            this.drawFigure(fa, rep);
        }
    }

    private genEnemies() {
        this.ctx.lineWidth = 1.5;
        let r = this.getCacheRecord('muncher');
        for (let f = 0; f < 5; ++f) {
            r.addFrame(this.getNextCachePos());
            let d = f / 20;
            this.drawFigure([
                [DP.arc, 0.5, 0.5, 0.45, 0, 2],
                [DP.arc, 0.3, 0.3, 0.04, 0, 2],
                [DP.arc, 0.7, 0.3, 0.04, 0, 2],

                [DP.line, 0.25, 0.75 + d, 0.25 + 0.125, 0.75 - 0.125 + d],
                [DP.line, 0.25 + 0.125, 0.75 - 0.125 + d, 0.5, 0.75 + d],
                [DP.line, 0.5, 0.75 + d, 0.5 + 0.125, 0.75 - 0.125 + d],
                [DP.line, 0.5 + 0.125, 0.75 - 0.125 + d, 0.75, 0.75 + d],

                [DP.line, 0.25, 0.75 - d, 0.25 + 0.125, 0.75 - 0.125 - d],
                [DP.line, 0.25 + 0.125, 0.75 - 0.125 - d, 0.5, 0.75 - d],
                [DP.line, 0.5, 0.75 - d, 0.5 + 0.125, 0.75 - 0.125 - d],
                [DP.line, 0.5 + 0.125, 0.75 - 0.125 - d, 0.75, 0.75 - d],
            ], 2);
        }

        r = this.getCacheRecord('spyware');
        for (let f = 0; f < 10; ++f) {
            r.addFrame(this.getNextCachePos());
            let d = 0.15 * f / 10;
            this.drawFigure([
                [DP.arc, 0.5, 0.5, 0.45, 0, 2],
                [DP.line, 0.2, 0.4, 0.2 + d, 0.4],
                [DP.line, 0.3 + d, 0.4, 0.4, 0.4],
                [DP.line, 0.6, 0.4, 0.6 + d, 0.4],
                [DP.line, 0.7 + d, 0.4, 0.8, 0.4],
                [DP.line, 0.25, 0.7, 0.75, 0.7]
            ], 2);
        }

    }
    private genWallSegment(name: string, fig: Array<Array<number>>) {
        let r = this.getCacheRecord(name);
        for (let f = 0; f < 5; ++f) {
            r.addFrame(this.getNextCachePos());
            this.drawFigure(fig, 1 + f);
        }
    }
    private genWalls() {
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = "round";
        this.genWallSegment('wall-tb', [[DP.line, 0.5, 0, 0.5, 1]]);
        this.genWallSegment('wall-lr', [[DP.line, 0, 0.5, 1, 0.5]])
        this.genWallSegment('wall-tr', [
            [DP.line, 0.5, 0, 0.5, 0.25],
            [DP.arc, 0.75, 0.25, 0.25, 1, 0.5, 1],
            [DP.line, 0.75, 0.5, 1, 0.5]
        ]);
        this.genWallSegment('wall-tl', [
            [DP.line, 0.5, 0, 0.5, 0.25],
            [DP.arc, 0.25, 0.25, 0.25, 0, 0.5, 0],
            [DP.line, 0.25, 0.5, 0, 0.5]
        ]);
        this.genWallSegment('wall-br', [
            [DP.line, 0.5, 1, 0.5, 0.75],
            [DP.arc, 0.75, 0.75, 0.25, 1, 1.5, 0],
            [DP.line, 0.75, 0.5, 1, 0.5]
        ]);
        this.genWallSegment('wall-bl', [
            [DP.line, 0.5, 1, 0.5, 0.75],
            [DP.arc, 0.25, 0.75, 0.25, 2, 1.5, 1],
            [DP.line, 0.25, 0.5, 0, 0.5]
        ]);
        this.genWallSegment('wall-tbl', [[DP.line, 0.5, 0, 0.5, 1], [DP.line, 0, 0.5, 0.5, 0.5]]);
        this.genWallSegment('wall-tbr', [[DP.line, 0.5, 0, 0.5, 1], [DP.line, 0.5, 0.5, 1, 0.5]]);
        this.genWallSegment('wall-tlr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0, 0.5, 0.5]]);
        this.genWallSegment('wall-blr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0.5, 0.5, 1]]);
        this.genWallSegment('wall-tblr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0, 0.5, 1]]);

    }

    private genFloor() {
        //this.ctx.strokeStyle='#00A0A0';
        /*
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = "round";
        this.genWallSegment('floor-tb', [[DP.line, 0.5, 0, 0.5, 1]]);
        this.genWallSegment('floor-lr', [[DP.line, 0, 0.5, 1, 0.5]])
        this.genWallSegment('floor-tr', [
            [DP.line, 0.5, 0, 0.5, 0.25],
            [DP.arc, 0.75, 0.25, 0.25, 1, 0.5, 1],
            [DP.line, 0.75, 0.5, 1, 0.5]
        ]);
        this.genWallSegment('floor-tl', [
            [DP.line, 0.5, 0, 0.5, 0.25],
            [DP.arc, 0.25, 0.25, 0.25, 0, 0.5, 0],
            [DP.line, 0.25, 0.5, 0, 0.5]
        ]);
        this.genWallSegment('floor-br', [
            [DP.line, 0.5, 1, 0.5, 0.75],
            [DP.arc, 0.75, 0.75, 0.25, 1, 1.5, 0],
            [DP.line, 0.75, 0.5, 1, 0.5]
        ]);
        this.genWallSegment('floor-bl', [
            [DP.line, 0.5, 1, 0.5, 0.75],
            [DP.arc, 0.25, 0.75, 0.25, 2, 1.5, 1],
            [DP.line, 0.25, 0.5, 0, 0.5]
        ]);
        this.genWallSegment('floor-tbl', [[DP.line, 0.5, 0, 0.5, 1], [DP.line, 0, 0.5, 0.5, 0.5]]);
        this.genWallSegment('floor-tbr', [[DP.line, 0.5, 0, 0.5, 1], [DP.line, 0.5, 0.5, 1, 0.5]]);
        this.genWallSegment('floor-tlr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0, 0.5, 0.5]]);
        this.genWallSegment('floor-blr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0.5, 0.5, 1]]);
        this.genWallSegment('floor-tblr', [[DP.line, 0, 0.5, 1, 0.5], [DP.line, 0.5, 0, 0.5, 1]]);

        this.genWallSegment('floor', [[DP.line, 0, 0, 1, 1], [DP.line, 1, 0, 0, 1]])*/
        this.ctx.strokeStyle = '#888888';
        let r = this.getCacheRecord('floor');
        r.addFrame(this.getNextCachePos());
        let cr = 0.1
        this.ctx.lineWidth = 1;
        this.ctx.shadowColor='#888888'
        this.drawFigure([[DP.arc, 0.5, 0.5, cr, 0, 2], 
            [DP.line, 0.5, 0.5-cr, 0.5, 0], 
            [DP.line, 0.5, 0.5+cr, 0.5, 1],
            [DP.line, 0.5-cr, 0.5, 0, 0.5], 
            [DP.line, 0.5+cr, 0.5, 1, 0.5],
        ],1);
        // this.drawFigure([[DP.arc, 0.5, 0.5, cr, 0, 2], 
        //     [DP.line, 0.5, 0.5-cr, 0.5, cr], [DP.arc, 0.5, 0, cr, 0, 1],
        //     [DP.line, 0.5, 0.5+cr, 0.5, 1-cr], [DP.arc, 0.5, 1, cr, 1, 2],
        //     [DP.line, 0.5-cr, 0.5, cr, 0.5], [DP.arc, 0, 0.5, cr, 1.5, 2.5],
        //     [DP.line, 0.5+cr, 0.5, 1-cr, 0.5], [DP.arc, 1, 0.5, cr, 0.5, 1.5],
        // ],1);
    }

    private genStairsDown() {
        this.ctx.strokeStyle = '#aaaaaa';
        let r = this.getCacheRecord('stairs-down');
        r.addFrame(this.getNextCachePos());
        let fig : Array<Array<number>> = [[DP.line, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0]]
        let w = 1/5
        let h  = 1/5
        let x = 1-w//0.5 - w/2
        let y = 1-h
        for(let i=0;i<5;++i) {
            fig.push([DP.line, x, y, x + w, y, x + w, y + h, x, y + h, x, y])
            y -= h
            w += h
            x = 1-w;//0.5 - w/2
        }
        this.drawFigure(fig, 1)
    }

    private genDoorFrame(off:number, f:number) {
        let d = f/10.0
        let a1 = off + d
        let a2 = 1 + off - d
        let a3 = 1 + off + d
        let a4 = 2 + off - d
        let rr = 0.5
        let x1 = 0.5 + rr*scos(a1)
        let y1 = 0.5 + rr*ssin(a1)
        let x2 = 0.5 + rr*scos(a2)
        let y2 = 0.5 + rr*ssin(a2)
        let x3 = 0.5 + rr*scos(a3)
        let y3 = 0.5 + rr*ssin(a3)
        let x4 = 0.5 + rr*scos(a4)
        let y4 = 0.5 + rr*ssin(a4)
        this.drawFigure([
            [DP.arc, 0.5, 0.5, 0.5, a1, a2], [DP.arc, 0.5, 0.5, 0.5, a3, a4], 
            [DP.line, x1, y1, x2, y2], [DP.line, x3, y3, x4, y4], 
        ],1);
    }

    private genDoors() {
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.shadowColor='#FFFFFF'
        this.ctx.lineWidth = 2;

        let r = this.getCacheRecord('door-h');
        for(let f = 0; f<5;++f) {
            r.addFrame(this.getNextCachePos());
            this.genDoorFrame(0.5, f)
        }
        r = this.getCacheRecord('door-h-locked');
        r.addFrame(this.getNextCachePos());
        this.genDoorFrame(0.5, 0)
        this.drawFigure([[DP.arc, 0.5, 0.5, 0.2, 1, 2], [DP.line, 0.3, 0.5, 0.7, 0.5, 0.7, 0.8, 0.3, 0.8, 0.3, 0.5]], 1)

        r = this.getCacheRecord('door-h-blocked');
        r.addFrame(this.getNextCachePos());
        this.genDoorFrame(0.5, 0)
        this.drawFigure([[DP.line, 0.2, 0.2, 0.8, 0.8], [DP.line, 0.2, 0.8, 0.8, 0.2]], 1)

        r = this.getCacheRecord('door-v');
        for(let f = 0; f<5;++f) {
            r.addFrame(this.getNextCachePos());
            this.genDoorFrame(0, f)
        }
        r = this.getCacheRecord('door-v-locked');
        r.addFrame(this.getNextCachePos());
        this.genDoorFrame(0, 0)
        this.drawFigure([[DP.arc, 0.5, 0.5, 0.2, 1, 2], [DP.line, 0.3, 0.5, 0.7, 0.5, 0.7, 0.8, 0.3, 0.8, 0.3, 0.5]], 1)
        
        r = this.getCacheRecord('door-v-blocked');
        r.addFrame(this.getNextCachePos());
        this.genDoorFrame(0.5, 0)
        this.drawFigure([[DP.line, 0.2, 0.2, 0.8, 0.8], [DP.line, 0.2, 0.8, 0.8, 0.2]], 1)
    }

    drawTile(pos: Pos, tileName: string, frame: number = 0) {
        let ctx = gr.getCtx();
        let r = this.cache[tileName];
        if (r) {
            let fr = r.frames.length;
            frame = ((frame % fr) + fr) % fr;
            let fi = r.frames[frame];
            ctx.drawImage(this.cacheCanvas, fi.outerRect.pos.x, fi.outerRect.pos.y, tileFullSize, tileFullSize, pos.x - tileGlowSize, pos.y - tileGlowSize, tileFullSize, tileFullSize);
            return fr;
        }
        return 0;
    }
    drawTileTinted(pos: Pos, tileName: string, color: string, frame: number = 0, extraSize: boolean = false) {
        let ctx = gr.getCtx();
        let r = this.cache[tileName];
        if (r) {
            let fr = r.frames.length;
            frame = ((frame % fr) + fr) % fr;
            let fi = r.frames[frame];
            let saveOp = ctx.globalCompositeOperation
            ctx.drawImage(this.cacheCanvas, fi.outerRect.pos.x, fi.outerRect.pos.y, tileFullSize, tileFullSize, pos.x - tileGlowSize, pos.y - tileGlowSize, tileFullSize, tileFullSize);
            ctx.globalCompositeOperation = 'multiply'
            ctx.fillStyle = color;
            if(extraSize) {
                ctx.fillRect(pos.x - tileGlowSize, pos.y - tileGlowSize, tileFullSize, tileFullSize)
            }
            else {
                ctx.fillRect(pos.x + tileExtraSize, pos.y + tileExtraSize, tileSize + tileGlowSize, tileSize + tileGlowSize)
            }
            ctx.globalCompositeOperation = saveOp
            return fr;
        }
        return 0;
    }
    getTileFrames(tileName: string) {
        let r = this.cache[tileName];
        if (r) {
            return r.frames.length;
        }
    }
}

