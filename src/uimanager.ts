import { Animation } from './animation';
import { MyMouseEvent } from './uibase';
import {UIContainer} from './uicontainer';
import * as gr from './graphics';

class UIManager extends UIContainer{
    timerId:number;
    animations:Array<Animation>=[];
    constructor()
    {
        super();
        var canvas : HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('canvas');
        canvas.onmousedown = (e)=>this.postRawMouseEvent('onMouseDown', e);
        canvas.onmouseup = (e)=>this.postRawMouseEvent('onMouseUp', e);
        canvas.onmousemove = (e)=>this.postRawMouseEvent('onMouseMove', e);
        canvas.oncontextmenu = (e)=>{e.preventDefault();return false;}
        this.timerId=setInterval(()=>this.draw(), 40);
    }
    postRawMouseEvent(name:string, e:MouseEvent)
    {
        let r = gr.getBoundingRect();
        let sz = gr.getAppSize();
        let x = (e.clientX - r.left) * sz.width / r.width;
        let y = (e.clientY - r.top) * sz.height / r.height;
        let d = new MyMouseEvent(x,y,e);
        this.postMouseEvent(name, d);
        // e.preventDefault()
        // e.stopPropagation()
        return false
    }
    draw()
    {
        gr.clear();
        this.animations=this.animations.filter((ani:Animation)=>ani.nextFrame());
        super.draw();
    }
    addAnimation(ani:Animation)
    {
        this.animations.push(ani);
    }
}

export let uiManager = new UIManager();
