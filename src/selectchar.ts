import { UIContainer } from "./uicontainer";
import { Button, ButtonOptions } from "./button";
import { tileSize, TileManager } from "./tilemanager";
import { Pos } from "./utils";
import { uiManager } from "./uimanager";
import { Game } from "./game";
import * as gr from './graphics';
import { Label } from "./label";
import { MyMouseEvent } from "./uibase";

const charDescr = [
`Idle Character is the most powerful when standing still.
Why rush toward the enemy if enemy can come to you.`,
`Impulse Character is all about fast movement and
transfer of his impulse into the pain of his enemies.`,
`Impact Character's attacks are so hard that they stun
his enemies making them unable to counter-attack.`
]

class TileButton extends Button {
    tile: string
    tilePos : Pos
    onStartHover: ()=>void
    onEndHover: ()=>void

    constructor(tile:string, text:string, onClick:()=>void, opts?: ButtonOptions) {
        super(text,onClick, opts)
        this.tile = tile
        this.rect.size.width += tileSize + 4
        this.tilePos = this.labelPos.clone()
        this.labelPos.x += tileSize + 4
    }
    onMouseEnter(e:MyMouseEvent) {
        super.onMouseEnter(e)
        if(this.onStartHover) {
            this.onStartHover()
        }
    }
    onMouseLeave(e:MyMouseEvent) {
        super.onMouseLeave(e)
        if(this.onEndHover) {
            this.onEndHover()
        }
    }
    draw() {
        super.draw()
        let pos = this.rect.pos.clone().add(this.tilePos)
        TileManager.instance.drawTile(pos, this.tile)
    }
}

export class CharSelector extends UIContainer {
    buttons : TileButton[]
    descr: Label

    constructor() {
        super()
        this.buttons = []
        let opts = {minWidth:320, minHeight:64}
        this.buttons.push(new TileButton('player-1', 'Idle', ()=>this.selectIdle(), opts))
        this.buttons.push( new TileButton('player-2', 'Impulse', ()=>this.selectImpulse(), opts))
        this.buttons.push( new TileButton('player-3', 'Impact', ()=>this.selectImpact(), opts))

        let maxWidth = this.buttons.reduce((mx, nx)=>mx.rect.size.width>nx.rect.size.width?mx:nx).rect.size.width
        let height = this.buttons[0].rect.size.height
        let spacing = 8

        let appRect = gr.getAppRect()

        let title = new Label(new Pos(), 'Select your character', 'white', 48)
        title.rect.pos.x = appRect.size.width/2 - title.rect.size.width/2
        this.add(title)

        let pos = appRect.size.toPos().div(2).sub(maxWidth/2, (height * this.buttons.length + spacing * (this.buttons.length - 1))/2)
        for(let idx = 0; idx<this.buttons.length;++idx) {
            let b = this.buttons[idx]
            b.rect.pos = pos.clone()
            this.add(b)
            b.onStartHover = ()=>this.setDescr(charDescr[idx])
            b.onEndHover = ()=>this.clearDescr()
            pos.y += b.rect.size.height + spacing
        }

        this.descr = new Label(new Pos(appRect.size.width/2, pos.y + 100), '')
        this.add(this.descr)
    }

    selectIdle() {
        this.close()
        uiManager.add(new Game(1));
    }

    selectImpulse() {
        this.close()
        uiManager.add(new Game(2));
    }

    selectImpact() {
        this.close()
        uiManager.add(new Game(3));
    }

    setDescr(txt:string) {
        this.descr.setLabel(txt)
        this.descr.centerX()
    }

    clearDescr() {
        this.descr.setLabel('')
    }
}