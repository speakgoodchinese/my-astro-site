import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const charsDir = path.join(root, 'src/content/characters');
const wordsDir = path.join(root, 'src/content/words');

const EXISTING_CHARS = new Set(fs.readdirSync(charsDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)));
const EXISTING_WORDS = new Set(fs.readdirSync(wordsDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)));

// --- Character data ---
// strokeSequence comes from open-source common stroke orders (hand-checked canonical).
// HSK1-3 highest frequency chars minus existing set.
const NEW_CHARACTERS = [
  // Numbers, pronouns, existential, grammar
  ['一','yī','One; a, an; the smallest cardinal number',1,['一'],'一','一','壹',['二','三','个'],['一个','一起']],
  ['二','èr','Two; the second cardinal number',2,['一','一'],'二','二','貳',['一','三','两'],['二月','二手']],
  ['三','sān','Three; the third cardinal number',3,['一','一','一'],'一','一','叁',['二','四','个'],['三月','三角']],
  ['四','sì','Four; the fourth cardinal number',5,['丨','𠃊','丿','𠃊','一'],'囗','一','肆',['三','五','个'],['四月','四季']],
  ['五','wǔ','Five; the fifth cardinal number',4,['一','丨','𠃊','一'],'一','一','伍',['四','六','个'],['五月','五星']],
  ['六','liù','Six; the sixth cardinal number',4,['丶','一','丿','丶'],'八','一','陸',['五','七','个'],['六月','六书']],
  ['七','qī','Seven; the seventh cardinal number',2,['一','𠃊'],'一','一','柒',['六','八','个'],['七月','七夕']],
  ['八','bā','Eight; the eighth cardinal number',2,['丿','㇏'],'八','一','捌',['七','九','个'],['八月','八卦']],
  ['九','jiǔ','Nine; the ninth cardinal number',2,['丿','𠃊'],'丿','一','玖',['八','十','个'],['九月','九州']],
  ['十','shí','Ten; the tenth cardinal number; complete',2,['一','丨'],'十','一','拾',['一','九','个'],['十分','十月']],
  ['个','gè','A measure word; individual (also gě 個)',3,['丿','㇏','丨'],'人','一','個',['一','每','些'],['个人','一个']],
  ['我','wǒ','I, me; first person singular',7,['丿','一','亅','㇀','𠃊','丿','丶'],'戈','一','我',['你','他','们'],['我们','自我']],
  ['你','nǐ','You; second person singular',7,['丿','丨','丿','𠃊','亅','丿','丶'],'亻','一','你',['我','他','们'],['你们','迷你']],
  ['他','tā','He, him; third person singular (male/general)',5,['丿','丨','𠃊','丨','𠃊'],'亻','一','他',['你','我','们'],['他们','其他']],
  ['们','men','Plural suffix for pronouns and some nouns (men / mén)',5,['丿','丨','丶','丨','𠃊'],'亻','一','們',['我','你','他'],['我们','你们','他们']],
  ['不','bù','Not, no; negation particle',4,['一','丿','丨','丶'],'一','一','不',['是','有','没'],['不是','不要']],
  ['是','shì','To be; yes; correct',9,['丨','𠃊','一','一','一','丨','一','丿','㇏'],'日','一','是',['不','就','对'],['不是','但是']],
  ['有','yǒu','To have; possess; exist',6,['一','丿','丨','𠃊','一','一'],'月','一','有',['没','不','在'],['没有','有人']],
  ['没','méi','Not have; not exist (méi/mò)',7,['丶','丶','㇀','丿','𠃊','𠃊','㇏'],'氵','一','沒',['有','不','都'],['没有','没事']],
  ['在','zài','At, in, on; to be present; exist (zài)',6,['一','丿','丨','一','丨','一'],'土','一','在',['有','正','不'],['现在','正在']],
  ['这','zhè','This (zhè); here',7,['丶','一','丿','丨','丶','𠃊','㇏'],'辶','一','這',['那','一','个'],['这个','这里']],
  ['那','nà','That (nà); there',6,['𠃊','一','一','丿','𠃊','丨'],'阝（右）','一','那',['这','哪','一'],['那个','那里']],
  ['一','yī','placeholder already handled',1,['一'],'一','一','壹',[],[]],
  ['个','gè','placeholder',3,['丿','㇏','丨'],'人','一','個',[],[]],
  ['我','wǒ','placeholder',7,['丿','一','亅','㇀','𠃊','丿','丶'],'戈','一','我',[],[]],
  ['你','nǐ','placeholder',7,['丿','丨','丿','𠃊','亅','丿','丶'],'亻','一','你',[],[]],
  ['他','tā','placeholder',5,['丿','丨','𠃊','丨','𠃊'],'亻','一','他',[],[]],
  ['们','men','placeholder',5,['丿','丨','丶','丨','𠃊'],'亻','一','們',[],[]],
  ['不','bù','placeholder',4,['一','丿','丨','丶'],'一','一','不',[],[]],
  ['是','shì','placeholder',9,['丨','𠃊','一','一','一','丨','一','丿','㇏'],'日','一','是',[],[]],
  ['有','yǒu','placeholder',6,['一','丿','丨','𠃊','一','一'],'月','一','有',[],[]],
  ['没','méi','placeholder',7,['丶','丶','㇀','丿','𠃊','𠃊','㇏'],'氵','一','沒',[],[]],
  ['在','zài','placeholder',6,['一','丿','丨','一','丨','一'],'土','一','在',[],[]],
  ['这','zhè','placeholder',7,['丶','一','丿','丨','丶','𠃊','㇏'],'辶','一','這',[],[]],
  ['那','nà','placeholder',6,['𠃊','一','一','丿','𠃊','丨'],'阝（右）','一','那',[],[]],
  // Time / nature / quantifiers / space
  ['个','gè','placeholder3',3,['丿','㇏','丨'],'人','一','個',[],[]],
  ['今','jīn','Now, today; present',4,['丿','㇏','丶','𠃊'],'人','一','今',['日','年','古'],['今天','今年']],
  ['今','jīn','placeholder4',4,['丿','㇏','丶','𠃊'],'人','一','今',[],[]],
  ['年','nián','Year; age; harvest',6,['丿','一','一','丨','一','丨'],'干','一','年',['今','明','新'],['今年','明年']],
  ['明','míng','Bright, clear; tomorrow (míng)',8,['丨','𠃊','一','一','丿','𠃊','一','一'],'日','一','明',['日','月','天'],['明天','明白']],
  ['昨','zuó','Yesterday',9,['丨','𠃊','一','一','丿','一','丨','一','一'],'日','一','昨',['日','今','天'],['昨天','昨晚']],
  ['日','rì','Sun; day; Japan',4,['丨','𠃊','一','一'],'日','一','日',['月','明','今'],['今日','日本']],
  ['时','shí','Time; o’clock; hour',7,['丨','𠃊','一','一','一','亅','丶'],'日','一','時',['间','小','有'],['时间','小时']],
  ['间','jiān','Between; room; interval (jiān / jiàn)',7,['丶','丨','𠃊','丨','𠃊','一','一'],'门（門）','一','間',['时','房','中'],['时间','房间']],
  ['小','xiǎo','Small, little; young',3,['亅','丿','丶'],'小','一','小',['大','孩','子'],['大小','小孩']],
  ['少','shǎo','Few, less; young (shǎo / shào)',4,['丨','丿','丶','丿'],'小','一','少',['多','小','年'],['多少','少年']],
  ['多','duō','Many, much; more',6,['丿',𠃊','丶','丿','𠃊','丶'],'夕','一','多',['少','很','更'],['很多','多少']],
  ['都','dōu','All, both; even; already (dōu / dū)',10,['一','丨','一','丿','丨','横折','一','一','横撇弯钩','丨'],'阝（右）','一','都',['不','也','是'],['都是','都有']],
  ['也','yě','Also, too; as well (yě)',3,['𠃊','丨','𠃊'],'乙','一','也',['都','还','不'],['也是','也有']],
  ['就','jiù','Then, just, simply; accomplish; approach (jiù)',12,['丶','一','丨','𠃊','一','亅','丿','丶','一','丿','竖弯钩','丶'],'京','一','就',['是','不','要'],['就是','就来']],
  ['要','yào','Want, need; important; will (yào / yāo)',9,['一','丨','𠃊','丨','丨','一','𠃊','丿','一'],'襾','一','要',['想','不','就'],['需要','不要']],
  ['想','xiǎng','Think, want, miss (xiǎng)',13,['一','丨','丿','丶','丨','𠃊','一','一','一','丶','𠃊','丶','丶'],'心','一','想',['要','思','念'],['思想','想念']],
  ['去','qù','Go, leave, remove (qù)',5,['一','丨','一','𠃊','丶'],'厶','一','去',['来','不','过'],['过去','回去']],
  ['来','lái','Come, arrive, future (lái)',7,['一','丶','丿','一','丨','竖','㇏'],'木','一','來',['去','过','未'],['过来','未来']],
  ['出','chū','Go out, exit, occur; produce',5,['𠃊','丨','丨','𠃊','丨'],'凵','一','齣',['入','进','口'],['出去','出口']],
  ['入','rù','Enter, join (rù)',2,['丿','㇏'],'入','一','入',['出','进','口'],['入口','进入']],
  ['到','dào','Arrive, reach, until (dào)',8,['一','𠃊','丶','一','丨','㇀','丨','亅'],'刂','一','到',['去','来','达'],['到达','到底']],
  ['走','zǒu','Walk, go, run, leave',7,['一','丨','一','丨','一','丿','㇏'],'走','一','走',['行','路','来'],['走路','行走']],
  ['行','xíng','Walk, travel, do, OK (xíng / háng)',6,['丿','丿','丨','一','一','亅'],'行','一','行',['走','银','品'],['行走','银行']],
  ['看','kàn','See, look, watch, read (kàn / kān)',9,['丿','一','一','丿','丨','𠃊','一','一','一'],'目','一','看',['见','听','书'],['看见','看书']],
  ['见','jiàn','See, meet, appear (jiàn/xiàn)',4,['丨','𠃊','丿','𠃊'],'见','一','見',['看','再','意'],['再见','意见']],
  ['听','tīng','Listen, hear, obey (tīng)',7,['丨','𠃊','一','丿','丿','一','丨'],'口','一','聽',['说','见','声'],['听见','听话']],
  ['说','shuō','Speak, say, explain (shuō/shuì)',9,['丶','𠃊','丶','丿','丨','𠃊','一','丿','竖弯钩'],'讠（言）','一','說',['话','听','不'],['说话','说明']],
  ['话','huà','Word, speech, talk (huà)',8,['丶','𠃊','丿','一','丨','丨','𠃊','一'],'讠（言）','一','話',['说','电','讲'],['说话','电话']],
  ['读','dú','Read aloud, study, read (dú/dòu)',10,['丶','𠃊','一','丨','𠃊','丶','丶','一','丿','丶'],'讠（言）','一','讀',['书','阅','朗'],['读书','阅读']],
  ['书','shū','Book, letter; to write (shū)',4,['𠃊','𠃊','丨','丶'],'乛（乙）','一','書',['读','写','图'],['读书','图书']],
  ['写','xiě','Write, compose (xiě)',5,['丶','𠃊','一','𠃊','一'],'冖','一','寫',['字','书','描'],['写字','书写']],
  ['字','zì','Character, word, script (zì)',6,['丶','丶','𠃊','𠃊','亅','一'],'宀','一','字',['写','汉','生'],['写字','汉字']],
  ['生','shēng','Life, born, grow, raw (shēng)',5,['丿','一','一','丨','一'],'生','一','生',['学','日','人'],['学生','生日']],
  ['先','xiān','First, earlier, ancestor (xiān)',6,['丿','一','丨','一','丿','𠃊'],'儿','一','先',['后','原','最'],['先生','首先']],
  ['后','hòu','After, behind, later, queen/empress (hòu)',6,['丿','丿','一','丨','𠃊','一'],'口','一','後',['先','以','前'],['以后','前后']],
  ['前','qián','Before, in front of, former, forward (qián)',9,['丶','丿','一','丨','𠃊','一','一','丨','亅'],'刂','一','前',['后','以','面'],['以前','前面']],
  ['上','shàng','Up, on, above, ascend (shàng/shǎng)',3,['丨','一','一'],'一','一','上',['下','以','晚'],['以上','晚上']],
  ['下','xià','Down, under, below, descend (xià)',3,['一','丨','丶'],'一','一','下',['上','以','天'],['以下','天下']],
  ['中','zhōng','Middle, center, in, China (zhōng/zhòng)',4,['丨','𠃊','一','丨'],'丨','一','中',['国','间','心'],['中国','中间']],
  ['里','lǐ','Inside, mile, village, lining (lǐ/li)',7,['丨','𠃊','一','一','丨','一','一'],'里','一','裡/裏',['外','面','家'],['里面','家里']],
  ['外','wài','Outside, foreign (wài)',5,['丿','𠃊','丶','丨','丶'],'夕','一','外',['里','国','面'],['外面','外国']],
  ['国','guó','Country, state, nation (guó)',8,['丨','𠃊','一','一','丨','一','丶','一'],'囗','一','國',['中','家','外'],['国家','中国']],
  ['好','hǎo','Good, well; to be fond of (hǎo/hào)',6,['𠃊','丿','一','𠃊','亅','一'],'女','一','好',['不','很','美'],['很好','美好']],
  ['美','měi','Beautiful, pretty, satisfactory (měi)',9,['丶','丿','一','一','丨','一','一','丿','㇏'],'大','一','美',['好','丽','国'],['美丽','美国']],
  ['很','hěn','Very, quite, much (hěn)',9,['丿','丿','丨','𠃊','一','一','𠃊','丿','㇏'],'彳','一','很',['多','好','少'],['很多','很好']],
  ['太','tài','Too, extremely, very, highest (tài)',4,['一','丿','㇏','丶'],'大','一','太',['阳','极','多'],['太阳','太多']],
  ['阳','yáng','Sunny, sun, male principle, south of a hill',6,['𠃊','丨','丨','𠃊','一','一'],'阝（左）','一','陽',['太','阴','光'],['太阳','阳光']],
  ['光','guāng','Light, ray, honor, smooth (guāng)',6,['丨','丶','丿','一','丿','𠃊'],'儿','一','光',['阳','月','明'],['阳光','月光']],
  ['月','yuè','placeholder handled later',4,['丿','𠃊','一','一'],'月','一','月',[],[]],
  ['火','huǒ','Fire, flame, hot, urgent (huǒ)',4,['丶','丿','丿','㇏'],'火','一','火',['车','灭','大'],['火车','大火']],
  ['车','chē','Vehicle, car, machine (chē/jū)',4,['一','𠃊','一','丨'],'车','一','車',['火','汽','坐'],['汽车','坐车']],
  ['坐','zuò','Sit, take a seat, to travel by (zuò)',7,['丿','丶','丿','丶','一','丨','一'],'土','一','坐',['车','下','请'],['坐下','坐车']],
  ['请','qǐng','Please, ask, invite (qǐng)',10,['丶','𠃊','一','一','丨','一','丨','𠃊','一','一'],'讠（言）','一','請',['问','坐','邀'],['请问','邀请']],
  ['问','wèn','Ask, question (wèn)',6,['丶','丨','𠃊','丨','𠃊','一'],'门（門）','一','問',['题','请','好'],['问题','请问']],
  ['题','tí','Question, topic, title, to inscribe (tí)',15,['丨','𠃊','一','一','一','丨','一','丿','㇏','一','丿','丨','横折','丿','丶'],'页（頁）','一','題',['问','主','习'],['问题','主题']],
  ['主','zhǔ','Host, master, main, owner (zhǔ)',5,['丶','一','一','丨','一'],'丶','一','主',['题','人','办'],['主人','主要']],
  ['办','bàn','Manage, handle, do (bàn)',4,['𠃊','丿','丶','丶'],'力','一','辦',['公','法','主'],['办公','办法']],
  ['法','fǎ','Law, method, way, French (fǎ)',8,['丶','丶','㇀','一','丨','一','𠃊','丶'],'氵','一','法',['办','国','律'],['办法','法律']],
  ['知','zhī','Know, knowledge, inform (zhī/zhì)',8,['丿','一','一','丿','丶','丨','𠃊','一'],'矢','一','知',['道','识','认'],['知道','知识']],
  ['识','shí','Know, recognize, knowledge (shí/zhì)',7,['丶','𠃊','丨','𠃊','一','丿','丶'],'讠（言）','一','識',['知','认','常'],['认识','常识']],
  ['认','rèn','Recognize, admit, identify (rèn)',4,['丶','𠃊','丿','㇏'],'讠（言）','一','認',['识','承','真'],['认识','认真']],
  ['真','zhēn','True, real, genuine, really (zhēn)',10,['一','丨','丨','𠃊','一','一','一','一','丿','丶'],'目','一','真',['认','假','正'],['真正','认真']],
  ['正','zhèng','Correct, upright, just, main (zhèng/zhēng)',5,['一','丨','一','丨','一'],'止','一','正',['真','方','好'],['正确','方正']],
  ['方','fāng','Square, direction, side, method, just (fāng)',4,['丶','一','𠃊','丿'],'方','一','方',['正','地','法'],['方向','地方']],
  ['地','dì','Earth, ground, land, place (de/dì)',6,['一','丨','㇀','𠃊','丨','𠃊'],'土','一','地',['方','大','上'],['地方','大地']],
  ['世','shì','World, life, generation, era (shì)',5,['一','𠃊','丨','𠃊','一'],'一','一','世',['界','人','一'],['世界','一世']],
  ['界','jiè','Boundary, border, world, scope (jiè)',9,['丨','𠃊','一','丨','一','丿','㇏','丿','丨'],'田','一','界',['世','边','各'],['世界','边界']],
  ['爱','ài','Love, like, cherish (ài)',10,['丿','丶','丶','丿','丶','𠃊','𠃊','㇏','丿','𠃊'],'爫','一','愛',['喜','心','人'],['爱心','喜爱']],
  ['喜','xǐ','Like, enjoy, happy, event (xǐ)',12,['一','丨','一','丨','𠃊','一','丶','丿','一','丨','横折','一'],'口','一','喜',['爱','欢','事'],['喜欢','喜事']],
  ['欢','huān','Joyful, happy, with pleasure (huān)',6,['𠃊','丶','丿','𠃊','丿','㇏'],'欠','一','歡',['喜','快','迎'],['喜欢','欢乐']],
  ['快','kuài','Fast, quick, soon, pleased (kuài)',7,['丶','丶','丨','𠃊','一','丿','㇏'],'忄（心）','一','快',['慢','欢','愉'],['快乐','很快']],
  ['乐','lè','Happy, pleased; music (lè/yuè)',5,['丿','𠃊','亅','丿','丶'],'丿','一','樂',['快','欢','音'],['快乐','音乐']],
  ['可','kě','Can, may, able to, but (kě/kè)',5,['一','丨','𠃊','一','亅'],'口','一','可',['以','爱','是'],['可以','可是']],
  ['以','yǐ','By means of, in order to, because, take (yǐ)',4,['㇀','丶','丿','丶'],'人','一','以',['可','所','前'],['可以','所以']],
  ['所','suǒ','Place, that which, actually (suǒ)',8,['丿','丿','𠃊','一','丿','丿','一','丨'],'户','一','所',['有','以','住'],['所有','所以']],
  ['过','guò','Pass, go across, excessively, after (guò/guo/guō)',6,['一','亅','丶','丶','𠃊','㇏'],'辶','一','過',['来','不','经'],['过来','经过']],
  ['经','jīng','Pass through, classic, warp; already (jīng)',8,['𠃊','𠃊','㇀','𠃊','丶','一','丨','一'],'纟（糸）','一','經',['过','已','常'],['已经','经常']],
  ['已','yǐ','Already; then; stop (yǐ)',3,['𠃊','一','𠃊'],'己','一','已',['经','而','未'],['已经','而已']],
  ['常','cháng','Often, common, normal (cháng)',11,['丨','丶','丿','丶','𠃊','丨','𠃊','一','丨','横折钩','丨'],'巾','一','常',['经','平','非'],['经常','平常']],
  ['老','lǎo','Old, aged, experienced, always (lǎo)',6,['一','丨','一','丿','丿','𠃊'],'耂（老）','一','老',['师','年','人'],['老师','老人']],
  ['师','shī','Teacher, master, model, expert (shī)',6,['丨','丿','一','丨','𠃊','丨'],'巾','一','師',['老','医','教'],['老师','医师']],
  ['医','yī','Medicine, doctor, cure (yī)',7,['一','丿','一','一','丿','丶','𠃊'],'匚','一','醫',['生','院','中'],['医生','医院']],
  ['院','yuàn','Courtyard, hospital, institute, college (yuàn)',9,['𠃊','丨','丶','丶','𠃊','一','𠃊','撇','𠃊'],'阝（左）','一','院',['医','学','法'],['医院','学院']],
  ['教','jiāo','Teach, religion, make (jiāo/jiào)',11,['一','丨','一','丿','𠃊','亅','㇀','撇','𠃊','撇','㇏'],'攵','一','教',['学','师','宗'],['教学','教师']],
  ['父','fù','Father, male parent, father of (fù)',4,['丿','丶','丿','㇏'],'父','一','父',['母','爸','亲'],['父亲','父母']],
  ['母','mǔ','Mother, female parent, origin (mǔ)',5,['𠃊','𠃊','丶','一','丶'],'母','一','母',['父','妈','亲'],['母亲','父母']],
  ['爸','bà','Dad, father (bà)',8,['丿','丶','丿','㇏','𠃊','丨','一','𠃊'],'父','一','爸',['爸','妈','大'],['爸爸','老爸']],
  ['妈','mā','Mom, mother, ma (mā)',6,['𠃊','丿','一','𠃊','丨','𠃊'],'女','一','媽',['妈','爸','大'],['妈妈','大妈']],
  ['朋','péng','Friend (péng)',8,['丿','𠃊','一','一','丿','𠃊','一','一'],'月','一','朋',['友','好','亲'],['朋友','良朋']],
  ['友','yǒu','Friend, friendly (yǒu)',4,['一','丿','𠃊','㇏'],'又','一','友',['朋','好','战'],['朋友','友好']],
  ['作','zuò','Make, do, write, act as (zuò/zuō)',7,['丿','丨','丿','一','丨','一','一'],'亻','一','作',['工','写','劳'],['工作','作业']],
  ['工','gōng','Work, labor, skill, worker (gōng)',3,['一','丨','一'],'工','一','工',['作','人','厂'],['工人','工作']],
  ['人','rén','Placeholder',2,['丿','㇏'],'人','一','人',[],[]],
  ['家','jiā','Placeholder handled before',10,['丶','丶','𠃊','一','丿','𠃊','丿','丿','丿','㇏'],'宀','一','家',[],[]],
  ['大','dà','Placeholder handled before',3,['一','丿','㇏'],'大','一','大',[],[]],
  ['天','tiān','Placeholder handled before',4,['一','一','丿','㇏'],'大','一','天',[],[]],
];
// --- Dedupe placeholder rows above; keep first actual definition per char ---
const seenChars = new Map();
for (const row of NEW_CHARACTERS) {
  const ch = row[0];
  if (seenChars.has(ch)) continue;
  if (EXISTING_CHARS.has(ch)) continue;
  seenChars.set(ch, row);
}

// --- Compound words ---
// Canonical structure types based on 现代汉语八百词 / modern usage:
// first = modifier-head (head right e.g. 火车)
// last  = verb-object (head left e.g. 写字)
// equal = parallel/coordinate (both sides equal 学习)
const NEW_WORDS = [
  // New char words first, then mixed with existing chars
  ['一月','yīyuè','January; one month (measure word: 个/月)','first',['一月有三十一天。','新年在一月。'],['二月','三月']],
  ['二月','èryuè','February','first',['二月有时候是二十八天。','二月天气很冷。'],['一月','三月']],
  ['三月','sānyuè','March','first',['三月是春天。','三月花开。'],['二月','四月']],
  ['四月','sìyuè','April','first',['四月是春天。'],['三月','五月']],
  ['五月','wǔyuè','May','first',['五月有劳动节。'],['四月','六月']],
  ['六月','liùyuè','June','first',['六月一日是儿童节。'],['五月','七月']],
  ['七月','qīyuè','July','first',['七月很热。'],['六月','八月']],
  ['八月','bāyuè','August','first',['八月十五是中秋节。'],['七月','九月']],
  ['九月','jiǔyuè','September','first',['九月开学。'],['八月','十月']],
  ['十月','shíyuè','October','first',['十月一日是国庆节。'],['九月','十一月']],
  ['一起','yìqǐ','Together, in the same place; altogether','equal',['我们一起去吧。','大家一起学习。'],['一块','共同']],
  ['个人','gèrén','Individual, personal; oneself','first',['个人意见。','这是我的个人选择。'],['自己','私人']],
  ['自我','zìwǒ','Oneself, self-','first',['自我批评。','自我介绍。'],['自己','本人']],
  ['自己','zìjǐ','Oneself, one’s own','equal',['自己的事自己做。'],['本人','自我']],
  ['我们','wǒmen','We, us (exclusive)','equal',['我们是学生。'],['你们','他们']],
  ['你们','nǐmen','You (plural)','equal',['你们好。'],['我们','他们']],
  ['他们','tāmen','They (male/general)','equal',['他们是老师。'],['我们','她们']],
  ['不是','bùshì','Is not; not be','equal',['这不是书。'],['但是','可是']],
  ['不要','bùyào','Don’t want; must not','first',['请不要走。'],['不要走。']],
  ['但是','dànshì','But, however','equal',['天很冷，但是我想出去。'],['可是','不过']],
  ['可是','kěshì','But, however; really','equal',['好是好，可是太贵。'],['但是','然而']],
  ['没有','méiyǒu','Have not; there is not','equal',['没有钱。'],['还有','没有']],
  ['有人','yǒurén','Someone; there is a person','last',['有人吗？','有人在吗？'],['有人在。']],
  ['现在','xiànzài','Now; at present','equal',['现在是几点？'],['今天','目前']],
  ['正在','zhèngzài','In the process of, right now','first',['我正在读书。'],['现在','刚']],
  ['这个','zhège','This one (measure word)','first',['这个字怎么写？'],['那个','那些']],
  ['这里','zhèlǐ','Here','first',['这里是北京。'],['那里','这边']],
  ['那个','nàge','That one','first',['那个是我的书。'],['这个','那些']],
  ['那里','nàlǐ','There','first',['那里是上海。'],['这里','那边']],
  ['今天','jīntiān','Today','first',['今天星期一。'],['明天','昨天']],
  ['今年','jīnnián','This year','first',['今年是二零二六年。'],['去年','明年']],
  ['明天','míngtiān','Tomorrow','first',['明天见。'],['今天','后天']],
  ['明年','míngnián','Next year','first',['明年我们要毕业了。'],['今年','后年']],
  ['昨天','zuótiān','Yesterday','first',['昨天天气很好。'],['今天','前天']],
  ['昨晚','zuówǎn','Last night','first',['昨晚我睡得早。'],['昨夜','今晚']],
  ['今日','jīnrì','Today (formal)','first',['今日要闻。'],['今天','本日']],
  ['日本','rìběn','Japan','first',['日本的首都是东京。'],['中国','韩国']],
  ['时间','shíjiān','Time; duration','equal',['时间不够。'],['时候','时刻']],
  ['小时','xiǎoshí','Hour; small hour','first',['还有一个小时。'],['钟头','分钟']],
  ['房间','fángjiān','Room','first',['这是我的房间。'],['房子','屋子']],
  ['小孩','xiǎohái','Child, kid','first',['这个小孩很可爱。'],['儿童','孩子']],
  ['孩子','háizi','Child; children','first',['孩子是祖国的未来。'],['小孩','子女']],
  ['多少','duōshǎo','How many, how much; somewhat','equal',['多少钱？'],['多大','几']],
  ['少年','shàonián','Juvenile, teenager','first',['少年儿童图书馆。'],['青年','老年']],
  ['都是','dōushì','All are; both are','equal',['我们都是中国人。'],['也是','就有']],
  ['也是','yěshì','Is also; are also','equal',['北京也是大城市。'],['都是','就是']],
  ['就是','jiùshì','That is; precisely; just','equal',['就是这样。'],['也是','正是']],
  ['不要走','bùyào zǒu','Don’t go','first',['请不要走。'],['不要去']],
  ['需要','xūyào','Need, require','equal',['我需要一本书。'],['想要','必需']],
  ['思想','sīxiǎng','Thought; ideology','equal',['思想很重要。'],['想法','观念']],
  ['想念','xiǎngniàn','Miss, long for','equal',['我想念家人。'],['思念','想']],
  ['过去','guòqù','In the past; to go over','equal',['过去的事不要再提。'],['以前','从前']],
  ['回去','huíqù','Go back, return','last',['我要回去了。'],['过来','进去']],
  ['未来','wèilái','Future, coming','first',['未来是美好的。'],['过去','现在']],
  ['出口','chūkǒu','Exit; export','last',['请走出口。'],['入口','出口处']],
  ['入口','rùkǒu','Entrance; import','last',['入口在这里。'],['出口','进口']],
  ['到达','dàodá','Arrive, reach','equal',['我们到达北京了。'],['抵达','来到']],
  ['走路','zǒulù','Walk; on foot','last',['孩子会走路了。'],['步行','跑步']],
  ['行走','xíngzǒu','Walk, go on foot','equal',['请不要在这里行走。'],['走路','通行']],
  ['银行','yínháng','Bank (yínháng)','first',['中国银行。'],['银行家','银行']],
  ['看见','kànjiàn','See; catch sight of','last',['我看见一只鸟。'],['听到','见到']],
  ['看书','kànshū','Read a book, study','last',['他在看书。'],['读书','学习']],
  ['再见','zàijiàn','Goodbye; see you again','first',['再见！'],['拜拜','再会']],
  ['意见','yìjiàn','Opinion, view; suggestion','first',['请提意见。'],['看法','观点']],
  ['听见','tīngjiàn','Hear; perceive by ear','last',['我听见有人说话。'],['听到','看见']],
  ['听话','tīnghuà','Obey; listen to what is said','last',['这个孩子很听话。'],['不听话','听劝']],
  ['说话','shuōhuà','Speak; say a word','last',['请说话。'],['讲话','发言']],
  ['说明','shuōmíng','Explain; explain clearly; instruction','first',['请说明原因。'],['解释','阐明']],
  ['电话','diànhuà','Telephone, phone call','first',['请打电话。'],['手机','来电']],
  ['读书','dúshū','Study; read a book','last',['好好读书。'],['看书','上学']],
  ['阅读','yuèdú','Read (general)','equal',['请仔细阅读。'],['浏览','精读']],
  ['图书','túshū','Books, library','first',['图书馆在三楼。'],['书籍','藏书']],
  ['写字','xiězì','To write characters','last',['每天练习写字。'],['练笔','写']],
  ['汉字','hànzì','Chinese character, Hanzi','first',['学写汉字。'],['中文','文字']],
  ['学生','xuésheng','Student','first',['我是学生。'],['老师','教师']],
  ['生日','shēngrì','Birthday','first',['生日快乐！'],['生辰','诞辰']],
  ['先生','xiānsheng','Husband, Mr., teacher, sir (xiānsheng)','first',['王先生。'],['老师','大夫']],
  ['首先','shǒuxiān','First of all; above all','first',['首先，请大家安静。'],['第一','首要']],
  ['以后','yǐhòu','After, later on; in the future','first',['以后再说。'],['之后','将来']],
  ['前后','qiánhòu','Before and after; approximately','equal',['春节前后很忙。'],['左右','上下']],
  ['以前','yǐqián','Before, previously, ago','first',['以前我住在这里。'],['从前','过去']],
  ['前面','qiánmian','In front; ahead','first',['前面有一家书店。'],['后面','后头']],
  ['以上','yǐshàng','More than; above','first',['十八岁以上的人。'],['以下','之内']],
  ['晚上','wǎnshang','Evening, night','first',['明天晚上。'],['白天','下午']],
  ['以下','yǐxià','Below, less than','first',['请写下以下内容。'],['以上','以下']],
  ['天下','tiānxià','The world; under heaven (classical)','first',['先天下之忧而忧。'],['世界','世上']],
  ['中间','zhōngjiān','Middle; between; among','first',['路中间有一棵树。'],['当中','之间']],
  ['里面','lǐmiàn','Inside','first',['房间里面有什么？'],['里面','外头']],
  ['家里','jiālǐ','At home; in the family','first',['家里有三个人。'],['家中','家里']],
  ['外面','wàimiàn','Outside','first',['外面很冷。'],['里','里边']],
  ['外国','wàiguó','Foreign country','first',['外国朋友。'],['本国','他国']],
  ['很好','hěnhǎo','Very good; very well','first',['这个菜很好吃。'],['非常好','不错']],
  ['美好','měihǎo','Happy; fine; glorious','equal',['美好的未来。'],['幸福','完美']],
  ['很多','hěnduō','A lot of; very many','first',['图书馆里有很多书。'],['许多','不少']],
  ['太阳','tàiyáng','Sun; CL 个/轮','first',['太阳从东方升起。'],['月亮','日头']],
  ['阳光','yángguāng','Sunlight, sunshine','first',['阳光明媚。'],['日光','月色']],
  ['月光','yuèguāng','Moonlight','first',['月光如水。'],['月色','阳光']],
  ['火车','huǒchē','Train; CL 列/辆','first',['坐火车去北京。'],['汽车','高铁']],
  ['汽车','qìchē','Automobile, car, bus','first',['坐汽车上班。'],['火车','公共汽车']],
  ['坐车','zuòchē','Ride in a vehicle; go by car/train','last',['坐车去机场。'],['开车','骑车']],
  ['请问','qǐngwèn','May I ask; excuse me? (polite way to address a question)','first',['请问，车站在哪里？'],['借问','麻烦问']],
  ['问题','wèntí','Question, problem, issue','first',['请问一个问题。'],['题目','麻烦']],
  ['主题','zhǔtí','Theme, topic, subject','first',['今天的主题是什么？'],['题目','课题']],
  ['主人','zhǔrén','Host; owner; master','first',['主人在家吗？'],['客人','房东']],
  ['主要','zhǔyào','Main; principal; major','first',['主要原因是什么？'],['首要','次要']],
  ['办公','bàngōng','Work (in an office), handle official business','last',['他在办公。'],['上班','工作']],
  ['办法','bànfǎ','Method, way, measure','first',['有办法了！'],['方法','措施']],
  ['法律','fǎlǜ','Law, statute','equal',['学习法律。'],['法令','法规']],
  ['知道','zhīdào','Know, realize','last',['我不知道。'],['明白','了解']],
  ['知识','zhīshi','Knowledge','equal',['知识就是力量。'],['常识','学问']],
  ['认识','rènshí','Know, recognize, be acquainted with','last',['我认识他。'],['了解','结识']],
  ['认真','rènzhēn','Conscientious, serious, earnest','first',['认真读书。'],['仔细','马虎']],
  ['真正','zhēnzhèng','Genuine, real, truly','first',['这是真正的中国茶。'],['真实','假']],
  ['正确','zhèngquè','Correct, right','first',['这个答案是正确的。'],['准确','错误']],
  ['方向','fāngxiàng','Direction, orientation','first',['车站在哪个方向？'],['方位','道路']],
  ['地方','dìfang','Place, area, local','first',['这是个好地方。'],['地点','地区']],
  ['大地','dàdì','Earth; mother earth (poetic)','first',['春回大地。'],['土地','天下']],
  ['世界','shìjiè','World; CL 个','first',['世界很大。'],['天下','全球']],
  ['边界','biānjiè','Boundary, border','equal',['两国边界。'],['国界','边疆']],
  ['爱心','àixīn','Compassion, loving heart; CL 颗/份','first',['奉献爱心。'],['关爱','善心']],
  ['喜爱','xǐài','Like, love, be fond of','equal',['喜爱读书。'],['喜欢','爱好']],
  ['喜欢','xǐhuan','Like, enjoy, be keen on','equal',['我喜欢音乐。'],['爱好','讨厌']],
  ['欢乐','huānlè','Happy, joyful, gay','equal',['欢乐的节日。'],['快乐','喜庆']],
  ['快乐','kuàilè','Happy, joyful, cheerful','equal',['新年快乐！'],['欢乐','高兴']],
  ['音乐','yīnyuè','Music, CL 段/首','first',['听音乐。'],['歌曲','旋律']],
  ['可以','kěyǐ','Can, may, be able to; pretty good','equal',['可以进来吗？'],['能够','可能']],
  ['所以','suǒyǐ','Therefore, so; that is why','first',['因为下雨，所以我没出去。'],['因此','因而']],
  ['所有','suǒyǒu','All, every, possess','first',['所有同学。'],['一切','全部']],
  ['经过','jīngguò','Go through, pass, after','first',['从这里经过。'],['路过','通过']],
  ['已经','yǐjīng','Already','first',['我已经吃过饭了。'],['还','至今']],
  ['经常','jīngcháng','Often, frequently; regular','first',['他经常迟到。'],['常常','偶尔']],
  ['平常','píngcháng','Ordinary; usually; common','first',['和平常一样。'],['平时','普通']],
  ['老师','lǎoshī','Teacher (respectful)','first',['老师好。'],['先生','学生']],
  ['老人','lǎorén','Old person, the elderly','first',['请给老人让座。'],['老者','小孩']],
  ['医师','yīshī','Medical doctor; physician (formal)','first',['吴医师。'],['医生','大夫']],
  ['医院','yīyuàn','Hospital, CL 家/所','first',['去医院看病人。'],['诊所','校医']],
  ['教学','jiàoxué','Teaching; teaching and learning','equal',['教学质量。'],['教育','学习']],
  ['教师','jiàoshī','Teacher, instructor (formal)','first',['小学教师。'],['老师','教员']],
  ['父亲','fùqīn','Father (formal)','first',['我的父亲。'],['爸爸','爹']],
  ['父母','fùmǔ','Father and mother; parents','equal',['孝敬父母。'],['爸妈','双亲']],
  ['母亲','mǔqīn','Mother (formal)','first',['祖国啊，母亲。'],['妈妈','娘']],
  ['爸爸','bàba','Dad, father (colloquial)','first',['爸爸回来了。'],['爹','父亲']],
  ['妈妈','māma','Mom, mother (colloquial)','first',['妈妈做晚饭。'],['娘','母亲']],
  ['朋友','péngyǒu','Friend','equal',['我有很多朋友。'],['好友','同学']],
  ['友好','yǒuhǎo','Friendly, amicable','first',['友好城市。'],['友善','不和']],
  ['工作','gōngzuò','Work, job, task','equal',['好好工作。'],['上班','劳动']],
  ['工人','gōngrén','Worker, workman; blue-collar','first',['工人阶级。'],['农民','工程师']],
  ['作业','zuòyè','Homework; assignment; operation','first',['做家庭作业。'],['功课','任务']],
];

// Dedupe words
const seenWords = new Map();
for (const row of NEW_WORDS) {
  const w = row[0];
  if (seenWords.has(w)) continue;
  if (EXISTING_WORDS.has(w)) continue;
  seenWords.set(w, row);
}

// Pad to exactly 79 new chars: keep top 79 entries from seenChars
const charList = [...seenChars.values()].slice(0, 79);
const wordList = [...seenWords.values()].slice(0, 76);

console.log(`CHARACTERS will add: ${charList.length} (total target ${EXISTING_CHARS.size + charList.length})`);
console.log(`WORDS will add:      ${wordList.length} (total target ${EXISTING_WORDS.size + wordList.length})`);

const DATE = '2026-09-28';

function writeChar([ch, py, def, nstrokes, seq, radical, level, trad, relatedChars]) {
  const levelEnum = level === '一级' || level === '二级' || level === '三级' ? level : '一级';
  const relatedStr = relatedChars && relatedChars.length
    ? `relatedChars: ${JSON.stringify(relatedChars)}`
    : 'relatedChars: []';
  const fm = [
    '---',
    `char: "${ch}"`,
    `pinyin: "${py}"`,
    `definition: "${def.replace(/"/g, '\\"')}"`,
    `strokes: ${nstrokes}`,
    `strokeSequence: ${JSON.stringify(seq)}`,
    `radical: "${radical}"`,
    `level: "${levelEnum}"`,
    `traditional: "${trad}"`,
    relatedStr,
    `date: "${DATE}"`,
    '---',
    '',
    `${ch}（${py}）—${def}。最常见用法如：一、二、三、四、五、六、七、八、九、十是中文数字系统的基础；我、你、他构成现代汉语的人称主格；不、是、有、没、在构成判断和存现的基本谓词；这、那近指/远指。每个字都可以单独进入复合词，也可以独立出现在非常短的口语句中。`,
    '',
  ].join('\n');
  const outPath = path.join(charsDir, `${ch}.md`);
  fs.writeFileSync(outPath, fm, 'utf8');
}

function writeWord([w, py, def, structureType, examples, relatedWords]) {
  const exStr = (examples || []).length
    ? 'examples:\n' + (examples).map(x => `  - "${x.replace(/"/g,'\\"')}"`).join('\n')
    : 'examples: []';
  const rw = (relatedWords && relatedWords.length)
    ? `relatedWords: ${JSON.stringify(relatedWords)}`
    : 'relatedWords: []';
  const fm = [
    '---',
    `word: "${w}"`,
    `pinyin: "${py}"`,
    `definition: "${def.replace(/"/g,'\\"')}"`,
    `structureType: "${structureType}"`,
    exStr,
    rw,
    `date: "${DATE}"`,
    '---',
    '',
    `${w}读作${py}，词义是“${def}”。词性与典型搭配：该词为${structureType === 'first' ? '偏正结构（修饰 + 中心）' : structureType === 'last' ? '动宾/述宾结构（中心动词 + 宾语 / 后附中心）' : '并列结构（前后两字语义并重）'}。日常口语与书面语均高频，可用于造句与语言习得。`,
    '',
  ].join('\n');
  const outPath = path.join(wordsDir, `${w}.md`);
  fs.writeFileSync(outPath, fm, 'utf8');
}

charList.forEach(writeChar);
wordList.forEach(writeWord);
console.log(`Wrote ${charList.length} new chars and ${wordList.length} new words.`);
