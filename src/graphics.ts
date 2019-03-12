import { Pos, Size, Rect } from './utils';

let canvas: HTMLCanvasElement = document.createElement('canvas')
canvas.id = 'canvas'
canvas.width = 1920
canvas.height = 1080
document.body.appendChild(canvas);
function onResize() {
    let cw = document.body.getBoundingClientRect().width
    let ch = document.body.getBoundingClientRect().height
    let scale = Math.min(cw / canvas.width, ch / canvas.height);
    //console.log(`cw=${cw}, ch=${ch}, scale=${scale}`);
    canvas.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', onResize)
setTimeout(onResize, 1)
let ctx = canvas.getContext('2d');
let fontSize: number;
setFontSize(32);

export function getCtx() {
    return ctx;
}

export function getBoundingRect() {
    return canvas.getBoundingClientRect();
}

export function getAppSize() {
    return new Size(canvas.width, canvas.height);
}

export function getAppRect() {
    return new Rect(0, 0, canvas.width, canvas.height);
}

export function setBg(clr: string) {
    ctx.fillStyle = clr;
}

export function clear() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.clearRect(0,0, canvas.width, canvas.height);
}

export function setClip(r: Rect) {
    ctx.save();
    let path: any = new Path2D();
    path.rect(r.pos.x, r.pos.y, r.size.width, r.size.height);
    ctx.clip(path);
}

export function resetClip() {
    ctx.restore();
}

export function fillrect(r: Rect, clr: string) {
    ctx.fillStyle = clr;
    ctx.fillRect(r.pos.x, r.pos.y, r.size.width, r.size.height);
}

export function rect(r: Rect, clr: string, lineWidth?: number, glowSize?: number) {
    ctx.beginPath();
    ctx.strokeStyle = clr;
    if (lineWidth) ctx.lineWidth = lineWidth;
    if (typeof glowSize === 'number') {
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = clr;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    ctx.rect(r.pos.x, r.pos.y, r.size.width, r.size.height);
    ctx.stroke();
    if (typeof glowSize === 'number') {
        ctx.shadowBlur = 0;
    }
}

export function line(from: Pos, to: Pos, color: string, lineWidth: number = 1) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

export function setFontSize(sz: number) {
    fontSize = sz;
    ctx.font = sz + "pt courier";
}

export function textout(x: number, y: number, clr: string, txt: string) {
    textoutex(x,y,clr,txt, '', 0)
}

export function textoutex(x: number, y: number, clr: string, txt: string, glowClr:string, glowSize:number) {
    ctx.shadowBlur = glowSize
    ctx.shadowColor = glowClr
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = clr;
    let lines = txt.split("\n")
    for (let l of lines) {
        ctx.fillText(l, x, y - fontSize / 8);
        y += fontSize
    }
}

export function getTextSize(txt: string) {
    let lines = txt.split("\n")
    let mxw = ctx.measureText(lines[0]).width;
    for (let i = 1; i < lines.length; ++i) {
        let w = ctx.measureText(lines[i]).width
        if (w > mxw) {
            mxw = w;
        }
    }
    return new Size(mxw, fontSize * lines.length);
}

export function getTextHeight() {
    return fontSize;
}