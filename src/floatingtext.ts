import { Animation } from "./animation";
import { Pos } from "./utils";
import * as gr from './graphics'

export class FloatingTextAni implements Animation {
    txt:string
    clr:string
    pos:Pos
    dir:Pos
    steps:number
    constructor(txt:string, clr:string, pos:Pos, dir:Pos, steps = 10) {
        this.txt = txt
        this.clr = clr
        this.pos = pos.clone()
        this.dir = dir.clone()
        this.steps = steps
    }
    nextFrame() {
        if(--this.steps<=0) {
            return false
        }
        gr.setFontSize(16)
        gr.textoutex(this.pos.x, this.pos.y, this.clr, this.txt, 'back', 4)
        this.pos.add(this.dir)
        return true
    }
}