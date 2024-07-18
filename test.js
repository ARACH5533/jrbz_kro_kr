function splitArgs(argsText){
    let args=[];let arg="";
    const TOKENS=[
        ["'", '"', "[", "{", "("],//start
        ["'", '"', "]", "}", ")"],//end
    ]
    let token=-1;//TOKENS index
    Array.from(argsText).forEach((char)=>{
        if(char===' '){
            if(token===-1) if(arg.length>0){args.push(arg); arg="";}
            else arg+=char;
            return;
        }
        if(token===-1 && TOKENS[0].includes(char)){
            token=TOKENS[0].indexOf(char);
            arg+=char;
            return;
        }
        if(token!==-1 && TOKENS[1].includes(char) && TOKENS[1].indexOf(char)===token){
            token=-1;
            arg+=char;
            return;
        }
        arg+=char;
    });
    if(arg.length>0) args.push(arg);
    return args;
}
/**
 * 
 * @param {ScriptPlayer} player zep-script player
 * @param {Function} afterEnd (player,time)=>{}
 * @param  {...Object} chat {chat:"",time:"",callback: (player,index,time)=>{}}
 */
function dialoger(player,afterEnd,...chat){
    let time=0;
    let ct=3000;
    chat.forEach((item,ind)=>{
        if(!isNaN(item.time))ct=item.time;
        const TIME=time;
        const CT=ct;
        setTimeout(()=>{
            if(!!item.chat) player.showCenterLabel(typeof(item.chat)==='string'?item.chat:item.chat(player,ind,TIME),item.color?? 0xFFFFFF, item.bgcolor??0x000000, item.offset??0/*offset */, CT);
            if(!!item.callback) item.callback(player,ind,TIME);
        },TIME);
        time+=ct;
    });
    setTimeout(()=>{
        afterEnd(player,time);
    },time);
}



App.onSay.Add(function(player, text) {
    if(player.role!==3001)return;
    if(!text.startsWith('!'))return;
    let args=splitArgs(text.substring(1));
    let cmd=args.shift();
    if(cmd==='eval'){
        eval(args.join(" "));//_ !eval App.showCenterLabel("test", 0xFFFFFF, 0x000000, 0);
        return;
    }
    if(cmd==='label'){
        App.showCenterLabel(args.join(" "));
        return;
    }
    if(cmd==='helper'){
        player.sendMessage("eval <script>\nlabel <message>\nhelper <cmd?>",0xFFFFFF);
        return;
    }
    player.sendMessage("명령어가 없습니다.",0xe74856);
});
let Dial=null,setPlay=null;
const dialogs=[
    (plr)=>{
        dialoger(plr,()=>{
            plr.showConfirm(plr.name+"이(가) 맞나요?", (re)=>{
                if(re)
                    Dial(plr,1);
                else plr.showPrompt("그렇다면 닉네임을 다시 입력해 주세요. 닉네임을 변경합니다.", (text)=>{
                    if(!!text) plr.name=text;
                    Dial(plr,1);
                });
            });
        },
        {chat: "안녕하세요! 만나서 반가워요.", time: 1500},
        {chat: "저는 당신의 업무를 도울 인공지능 비서입니다.",time:2000},
        {chat: "당신의 이름이 "+plr.name+"이(가) 맞나요?",time:1400});
    },
    (plr)=>{
        dialoger(plr,()=>{
                plr.showPrompt("어떤 테마로 시작해볼까요?\n1: 자연  2: 도시\n3: 우주",(text)=>{
                    if(!!text)text='1';
                    dialoger(plr,()=>{
                    Dial(plr,[Number(Array.from(text).find(i=>!isNaN(Number(i))&&0<Number(i)&&Number(i)<4))]+1);
                    },{chat: "멋진 선택이에요! 이제 그 테마로 맵을 만들기 시작할게요.",time:3000});

                });
                Dial(plr,2);
            },
            {chat: "좋아요, 이제 시작해볼까요!", time: 1500},
            {chat: "음, 이곳은 아직 아무것도 없네요.", time: 1500},
            {chat: "먼저 맵을 만들어야 할 것 같아요. 어떤 테마로 시작해볼까요?", time: 4000},
        );
    },
    (plr)=>{//자연 2
        dialoger(plr,()=>{

        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000});
    },
    (plr)=>{//도시 3
        dialoger(plr,()=>{
            
        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000});
    },
    (plr)=>{//우주 4
        dialoger(plr,()=>{
            
        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000});
    },
];
let chatingPlayers={};//"ID":{step:1,playing:true}
Dial=(plr,step)=>{
    if(!chatingPlayers[plr.id])return;
    chatingPlayers[plr.id].step=step;
    dialogs[step](plr);
};
setPlay=(plr,play)=>{
    if(!chatingPlayers[plr.id])return;
    chatingPlayers[plr.id].playing=play;
};
function isPlaying(plr){
    if(!chatingPlayers[plr.id])return false;
    return chatingPlayers[plr.id].playing;
}
App.onObjectTouched.Add(function (sender, x, y, tileID, obj) {
    if(obj===null){
        //App.sayToAll(`obj is null`, 0xFFFFFF);
        return;
    }
    if (obj.type == ObjectEffectType.INTERACTION_WITH_ZEPSCRIPTS) {
        //App.sayToAll(`Number = ${obj.text}, Value = ${obj.param1}`, 0xFFFFFF);
        if(obj.param1==='chat'){
            if(!!chatingPlayers[sender.id] && !isPlaying(sender)){
                dialogs[chatingPlayers[sender.id].step](sender);
                return;
            }
            chatingPlayers[sender.id]={step:0,playing:true};
            dialogs[0](sender);
        }else if(obj.param1==='out'){
            if(isPlaying(sender)){
                sender.sendMessage('진행도중 종료할 수 없습니다.',0xe74856);
            }else{
                sender.spawnAt(20,12,1);
            }
        }
    }
});
App.onLeavePlayer.Add(function(player){
    //setPlay(player,false);
    chatingPlayers[plr.id]=null;
});
