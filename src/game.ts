import { RoomsGenerator } from './generators';
import { UIContainer } from './uicontainer';
import { Player } from './player';
import { Hud } from './hud';
import { Level } from './level';
import { PlayerActions } from './playeractions';

export class Game extends UIContainer implements PlayerActions{
    currentLevel:Level;
    hud:Hud;
    player:Player;
    depth = 1
    constructor(type:number)
    {
        super();
        this.player=new Player(type);
        this.hud = new Hud(this.player)
        this.add(this.hud);
        this.nextLevel()
    }
    nextLevel() {
        this.currentLevel=new Level(this);
        let gen=new RoomsGenerator(this.depth)
        gen.generate(this.currentLevel);
        this.currentLevel.addPlayer(this.player);
        this.add(this.currentLevel);
        this.hud.assignMap(this.currentLevel)
        ++this.depth
    }

}