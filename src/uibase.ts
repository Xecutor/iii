import * as Mousetrap from 'mousetrap';
import 'mousetrap/plugins/pause/mousetrap-pause'
import { UIContainer } from './uicontainer';
import { Pos, Size, Rect } from './utils';
import { getAppRect } from "./graphics";

export class MyMouseEvent {
    x : number;
    y : number;
    original : MouseEvent;
    constructor(x:number, y:number, original: MouseEvent)
    {
        this.x = x;
        this.y = y;
        this.original = original;
    }
}

interface MouseEventHandler {
    onMouseMove(e:MyMouseEvent):void
    onMouseDown(e:MyMouseEvent):void
    onMouseUp(e:MyMouseEvent):void
    onMouseEnter(e:MyMouseEvent):void
    onMouseLeave(e:MyMouseEvent):void
    getHandler(name:string): (e:MyMouseEvent)=>void
}

interface MouseEventHandlerIndex {
    [key:string] : (e:MyMouseEvent)=>void
}

export class UIBase implements MouseEventHandler{
    rect:Rect = getAppRect().clone();
    parent:UIContainer;
    bindings=new Mousetrap();
    mouseOver = false;
    clickOnUp = false;
    onClick: (e?:MyMouseEvent) => void;
    draw()
    {
    }
    close()
    {
        this.parent.remove(this);
    }
    isInside(pos:Pos)
    {
        return this.rect.isInside(pos);
    }

    pauseBindings()
    {
        this.bindings.pause();
    }

    resumeBindings()
    {
        this.bindings.unpause();
    }

    centerX(x?:number) {
        if(x===undefined) {
            x=this.parent.rect.size.width/2
        }
        this.rect.pos.x = x - this.rect.size.width/2
    }

    onMouseMove(e:MyMouseEvent){}
    onMouseEnter(e: MyMouseEvent) {
        this.mouseOver = true;
    }
    onMouseLeave(e: MyMouseEvent) {
        this.mouseOver = false;
        this.clickOnUp = false;
    }
    onMouseDown(e: MyMouseEvent) {
        this.clickOnUp = true;
    }
    onMouseUp(e: MyMouseEvent) {
        if (this.clickOnUp && this.onClick) {
            this.onClick(e);
        }
        this.clickOnUp = false;
    }

    getHandler(name:string): (e:MyMouseEvent)=>void
    {
        let rv = ((this as any)as MouseEventHandlerIndex)[name]
        return rv
    }

    onAdd?():void;
    onRemove()
    {
        this.bindings.reset();
    }
}
