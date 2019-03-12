import { uiManager } from './uimanager';
import { Entity } from './entity';
import { CyclicAnimation } from "./animation";
import { DIR } from "./utils";
import { MapAccessor } from "./mapaccessor";

export class ConnectionPiece extends Entity {
    conn=[false,false,false,false]
    prefix:string;
    constructor(srcDir:number,startFrame:number=0, prefix='my')
    {
        super();
        this.prefix=prefix;
        this.conn[srcDir]=true;
        this.update();
        let ani=new CyclicAnimation((frame)=>this.onFrame(frame),25,0,startFrame);
        uiManager.addAnimation(ani);
    }
    update()
    {
        let type='';
        for(let dir=0;dir<4;++dir) {
            if(this.conn[dir]) {
                type+=DIR[dir];
            }
        }
        this.tileName=this.prefix+'-connection-piece-'+type;
    }
    getDescription()
    {
        return 'Active Connection';
    }
    receiveDamage(val:number)
    {
    }
    getInt()
    {
        return 100;
    }
}