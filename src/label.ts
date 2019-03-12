import { Pos } from './utils';
import { UIBase } from './uibase';
import { getTextSize, textout, setFontSize } from "./graphics";

export class Label extends UIBase{
    label:string;
    color:string;
    fontSize:number;

    constructor(pos:Pos, label:string, color:string='white', fontSize:number=16)
    {
        super();
        this.color=color;
        this.fontSize=fontSize;
        this.rect.pos.assign(pos);
        this.setLabel(label)
    }

    setLabel(label:string) {
        this.label = label
        setFontSize(this.fontSize);
        this.rect.size.assign(getTextSize(label));
    }

    draw()
    {
        setFontSize(this.fontSize);
        textout(this.rect.pos.x, this.rect.pos.y, this.color, this.label);
    }
}