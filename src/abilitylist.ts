import { UIContainer } from "./uicontainer";
import { Ability } from "./abilities";
import { Rect, Pos, Size } from "./utils";
import { UIBase, MyMouseEvent } from "./uibase";
import * as gr from './graphics';
import { Label } from "./label";
import { Player } from "./player";

const abilityPlateSize = new Size(300,100)
const abilityPlateGapSize = 20
const abilityPlateTextSize = 16

export class AbilityPlate extends UIContainer {
    costsPos : Pos
    //mouseOver : boolean = false
    constructor(pos : Pos, txt:string, txtcolor:string) {
        super()
        this.rect.pos.assign(pos)
        this.rect.size.assign(abilityPlateSize)
        let label = new Label(pos.add(10,10), txt, txtcolor, abilityPlateTextSize)
        this.add(label)
        this.costsPos = label.rect.pos.clone().add(0,label.rect.size.height + abilityPlateTextSize / 4)
    }
    addCost(txt:string, txtcolor: string) {
        let clbl = new Label(this.costsPos, txt, txtcolor, abilityPlateTextSize)
        this.add(clbl)
        this.costsPos.add(clbl.rect.size.width, 0)
    }
    /*onMouseEnter(e:MyMouseEvent) {
        super.onMouseEnter(e)
        this.mouseOver = true
    }
    onMouseLeave(e:MyMouseEvent) {
        super.onMouseLeave(e)
        this.mouseOver = false
    }*/
    draw() {
        gr.fillrect(this.rect, this.mouseOver?'rgba(100, 100, 100, 0.6':'rgba(0, 0, 0, 0.5')
        gr.rect(this.rect, this.mouseOver?'#BBBBBB':'#999999', 2)
        super.draw()
    }
}

export class AbilityList extends UIContainer {
    player : Player
    onActivate: (a:Ability)=>void
    constructor(player:Player, onActivate: (a:Ability)=>void) {
        super()
        this.player = player
        this.onActivate = onActivate
    }
    activate(a:Ability) {
        this.close()
        this.onActivate(a)
    }
    onAdd() {
        const rows = 4
        const cols = 4
        let it = new Rect(0, 0, cols, rows).getIterator()
        it.next()
        let xst = abilityPlateSize.width + abilityPlateGapSize
        let yst = abilityPlateSize.height + abilityPlateGapSize
        let startPos = new Pos();
        startPos.x= this.parent.rect.size.width/2 - (xst*cols)/2
        startPos.y=this.parent.rect.size.height/2 - (yst*rows)/2
        let bindKey = 1
        for(let a of this.player.getAbilitties()) {
            let haveCost = a.getCost().every(c=>this.player.getResource(c.res).value>=c.amount)

            let pos = startPos.clone().add(it.value.x * xst, it.value.y * yst)
            let ap = new AbilityPlate(pos, a.getName(), haveCost?'white':'lightgrey')
            let cost = a.getCost()
            for(let c of cost) {
                ap.addCost(c.amount.toString(), this.player.getResource(c.res).color)
            }
            if(haveCost) {
                ap.onClick = ()=>this.activate(a)
                this.bindings.bind(bindKey.toString(), ()=>this.activate(a))
            }
            this.add(ap)
            it.next()
            ++bindKey
        }
        this.bindings.bind('escape', ()=>this.close())
        this.onClick=(e:MyMouseEvent)=>{
            if(e.original.button==2) {
                this.close()
            }
        }
    }
}