/* Silent Autocorrect - Obsidian plugin */
const { Plugin, PluginSettingTab, Setting, Notice, Modal, Menu, MarkdownView, Platform, ItemView, setIcon, requestUrl, normalizePath } = require("obsidian");

const DEFAULT_SETTINGS = {
  autoCorrectEnabled: true,
  undoOnBackspace: true,
  correctTwoInitialCapitals: true,
  capitalizeFirstLetterSentences: true,
  capitalizeSolitaryI: true,
  fixCommonContractions: true,
  useFrequencyDictionary: true,
  fixSplitMergeErrors: true,
  freqCandidateTopN: 50000,
  freqDownloadPrompted: false,
  correctionLog: [],
  autocorrectSensitivity: "balanced",
  shorthandsEnabled: true,
  clinicalShorthands: {"pt":{"key":"pt","expansion":"patient","enabled":true,"mode":"silent","category":"clinical"},"pts":{"key":"pts","expansion":"patients","enabled":true,"mode":"silent","category":"clinical"},"hx":{"key":"hx","expansion":"history","enabled":true,"mode":"silent","category":"clinical"},"dx":{"key":"dx","expansion":"diagnosis","enabled":true,"mode":"silent","category":"clinical"},"tx":{"key":"tx","expansion":"treatment","enabled":true,"mode":"silent","category":"clinical"},"rx":{"key":"rx","expansion":"prescription","enabled":true,"mode":"silent","category":"clinical"},"sx":{"key":"sx","expansion":"symptoms","enabled":true,"mode":"silent","category":"clinical"},"fx":{"key":"fx","expansion":"fracture","enabled":true,"mode":"silent","category":"clinical"},"sob":{"key":"sob","expansion":"shortness of breath","enabled":true,"mode":"silent","category":"clinical"},"w/o":{"key":"w/o","expansion":"without","enabled":true,"mode":"silent","category":"clinical"},"w/":{"key":"w/","expansion":"with","enabled":true,"mode":"silent","category":"clinical"},"prn":{"key":"prn","expansion":"as needed","enabled":true,"mode":"silent","category":"dosage"},"bid":{"key":"bid","expansion":"twice daily","enabled":true,"mode":"silent","category":"dosage"},"tid":{"key":"tid","expansion":"three times daily","enabled":true,"mode":"silent","category":"dosage"},"qid":{"key":"qid","expansion":"four times daily","enabled":true,"mode":"silent","category":"dosage"},"po":{"key":"po","expansion":"orally","enabled":true,"mode":"silent","category":"dosage"},"npo":{"key":"npo","expansion":"nothing by mouth","enabled":true,"mode":"silent","category":"dosage"},"bp":{"key":"bp","expansion":"blood pressure","enabled":true,"mode":"silent","category":"vitals"},"hr":{"key":"hr","expansion":"heart rate","enabled":true,"mode":"silent","category":"vitals"},"rr":{"key":"rr","expansion":"respiratory rate","enabled":true,"mode":"silent","category":"vitals"},"temp":{"key":"temp","expansion":"temperature","enabled":true,"mode":"silent","category":"vitals"}},
  subDictionaries: {"cardiology":{"id":"cardiology","name":"Cardiology & Pulmonology","description":"Heart, circulation, arrhythmia, lungs, and ECG terminology","category":"cardiology","enabled":true,"mode":"silent","wordCount":61},"pharmacology":{"id":"pharmacology","name":"Pharmacology & Medications","description":"Generic and brand-name drugs, dosages, and pharmacokinetics","category":"pharmacology","enabled":true,"mode":"silent","wordCount":321},"surgery":{"id":"surgery","name":"Surgery & Procedures","description":"Surgical interventions, scopes, incisions, and diagnostics","category":"surgery","enabled":true,"mode":"silent","wordCount":55},"neurology":{"id":"neurology","name":"Neurology & Psychiatry","description":"Brain, nervous system, cognitive disorders, and mental health","category":"neurology","enabled":true,"mode":"silent","wordCount":34},"pathology":{"id":"pathology","name":"Pathology & Oncology","description":"Diseases, laboratory values, hematology, and neoplasms","category":"pathology","enabled":true,"mode":"silent","wordCount":38},"anatomy":{"id":"anatomy","name":"Anatomy & Physiology","description":"Organs, musculoskeletal, vasculature, and anatomical landmarks","category":"anatomy","enabled":true,"mode":"silent","wordCount":97}},
  enableEnglishDict: true,
  customWords: ["hypokalemia","troponin","holter","ecg","copd","gerd","cabg","dvt","pe"],
  customSubWords: {"cardiology":[],"pharmacology":[],"surgery":[],"neurology":[],"pathology":[],"anatomy":[]},
  customReplacements: {}
};

const MEDICAL_TYPOS = {"arrhytmia":"arrhythmia","arrithmia":"arrhythmia","arythmia":"arrhythmia","tachycarida":"tachycardia","tackcardia":"tachycardia","bradycarida":"bradycardia","acetominophen":"acetaminophen","acetaminiphen":"acetaminophen","amoxocillin":"amoxicillin","amoxycillin":"amoxicillin","amoxacillin":"amoxicillin","hypertenison":"hypertension","hypertention":"hypertension","hypotention":"hypotension","hypotensio":"hypotension","fibromyalga":"fibromyalgia","fibromialgia":"fibromyalgia","cardimyopathy":"cardiomyopathy","cardiomiopathy":"cardiomyopathy","atherosclersis":"atherosclerosis","arteriosclorosis":"arteriosclerosis","cholecystis":"cholecystitis","pancreatitus":"pancreatitis","appendicitus":"appendicitis","laproscopy":"laparoscopy","endocronology":"endocrinology","opthalmology":"ophthalmology","opthamology":"ophthalmology","erythrocites":"erythrocytes","leukocites":"leukocytes","thrombocytopina":"thrombocytopenia","gastroentritis":"gastroenteritis","gastritis":"gastritis","ketoacidocis":"ketoacidosis","ketoasidosis":"ketoacidosis","prednizone":"prednisone","prednizolone":"prednisolone","ibuprophen":"ibuprofen","ciproflaxin":"ciprofloxacin","metforman":"metformin","lisinipril":"lisinopril","atorvastin":"atorvastatin","hydrochlorathiazide":"hydrochlorothiazide","paresthsia":"paresthesia","hemotocrit":"hematocrit","hemoglogin":"hemoglobin","hemorrage":"hemorrhage","hemmorhage":"hemorrhage","diarhea":"diarrhea","diahrrea":"diarrhea","anaphylatic":"anaphylactic","anaphylaxis":"anaphylaxis","ischimia":"ischemia","ischemic":"ischemic","aneurism":"aneurysm","pnuemonia":"pneumonia","pnemonia":"pneumonia","auscultaion":"auscultation","palpitation":"palpitation","palpatation":"palpitation","phlebotomy":"phlebotomy","flebotomy":"phlebotomy","nephroligy":"nephrology","oncoligy":"oncology","neuroligy":"neurology","orthopedics":"orthopedics","orthopaedics":"orthopaedics","corticosteriod":"corticosteroid","trachestomy":"tracheostomy","craniotomy":"craniotomy","paracetemol":"paracetamol","encephalopothy":"encephalopathy","pericarditus":"pericarditis","meningitus":"meningitis","osteoarthritus":"osteoarthritis","diverticulitus":"diverticulitis","hypocalcemia":"hypocalcemia","hypercalcemia":"hypercalcemia","hyponatremia":"hyponatremia","hyperkalemia":"hyperkalemia","hypokalemia":"hypokalemia","metastasize":"metastasize","metastasis":"metastasis","palliative":"palliative","prophylaxis":"prophylaxis","prophylatic":"prophylactic","prognocis":"prognosis","etioligy":"etiology","troponin":"troponin","creatinine":"creatinine","bilirubin":"bilirubin","platelettes":"platelets","anesthesia":"anesthesia","anaesthesia":"anaesthesia","intubation":"intubation","defibrillation":"defibrillation","ventricle":"ventricle","atrium":"atrium","catheter":"catheter","cathetor":"catheter","septicemia":"septicemia","bacteremia":"bacteremia"};
const ENGLISH_TYPOS = {"teh":"the","adn":"and","taht":"that","waht":"what","wiht":"with","thier":"their","recieve":"receive","recieved":"received","recieving":"receiving","seperate":"separate","seperated":"separated","seperation":"separation","occured":"occurred","occuring":"occurring","occurence":"occurrence","becuase":"because","beacuse":"because","untill":"until","definately":"definitely","defiantly":"definitely","definitly":"definitely","goverment":"government","acheive":"achieve","acheived":"achieved","beleive":"believe","beleived":"believed","wierd":"weird","freind":"friend","freinds":"friends","tomorow":"tomorrow","tommorrow":"tomorrow","calender":"calendar","accommodate":"accommodate","acommodate":"accommodate","neccessary":"necessary","necesary":"necessary","truely":"truly","publically":"publicly","begining":"beginning","refering":"referring","refered":"referred","prefered":"preferred","prefering":"preferring","enviroment":"environment","embarass":"embarrass","embarassing":"embarrassing","embarassed":"embarrassed","harasment":"harassment","mispell":"misspell","mispelled":"misspelled","noticable":"noticeable","millenium":"millennium","accidentaly":"accidentally","accidently":"accidentally","succesful":"successful","successfull":"successful","sucessful":"successful","possession":"possession","posession":"possession","guarentee":"guarantee","garantee":"guarantee","maintainance":"maintenance","maintenence":"maintenance","pronounciation":"pronunciation","existance":"existence","independant":"independent","persistance":"persistence","resistence":"resistance","priviledge":"privilege","privledge":"privilege","apparantly":"apparently","familar":"familiar","rythm":"rhythm","writting":"writing","writen":"written","commited":"committed","disapear":"disappear","disapoint":"disappoint","disappointed":"disappointed","arguement":"argument","fourty":"forty","judgement":"judgment","twelfth":"twelfth","twelth":"twelfth","hygiene":"hygiene","heigth":"height","hight":"height","foreign":"foreign","foriegn":"foreign","concious":"conscious","unconcious":"unconscious","suprise":"surprise","suprised":"surprised","dissapear":"disappear","agressive":"aggressive","knowlege":"knowledge","colleague":"colleague","collegue":"colleague","consistant":"consistent","diferent":"different","diference":"difference","intresting":"interesting","slient":"silent","reallt":"really","autocorrent":"autocorrect","autocorrext":"autocorrect","sensitivitty":"sensitivity","sensitiviitiy":"sensitivity","mininum":"minimum","optmised":"optimised","optimized":"optimized","dont":"don't","cant":"can't","wont":"won't","dident":"didn't","didnt":"didn't","couldnt":"couldn't","shouldnt":"shouldn't","wouldnt":"wouldn't","havent":"haven't","hasnt":"hasn't","hadnt":"hadn't","isnt":"isn't","arent":"aren't","wasnt":"wasn't","werent":"weren't","thats":"that's","whats":"what's","theres":"there's","heres":"here's","wherere":"where're","youre":"you're","theyre":"they're","weve":"we've","theyve":"they've","youve":"you've","wouldve":"would've","couldve":"could've","shouldve":"should've","hows":"how's","whos":"who's","coudl":"could","shoudl":"should","woudl":"would","ahve":"have","haev":"have","hwo":"how","knwo":"know","owuld":"would","peopel":"people","probelm":"problem","probelms":"problems","secratary":"secretary","somethign":"something","tahn":"than","tghe":"the","thna":"than","tiem":"time","tihs":"this","towrad":"toward","untli":"until","vrey":"very","wnat":"want","wnats":"wants","wnated":"wanted","wnating":"wanting","yuo":"you","yuor":"your","yuors":"yours","abotu":"about","acn":"can","alot":"a lot","alreadyy":"already","alwasy":"always","anohter":"another","becuasee":"because","calendered":"calendared","carefull":"careful","diffrent":"different","everyting":"everything","familiy":"family","foward":"forward","freindly":"friendly","heirarchy":"hierarchy","hospitol":"hospital","imediate":"immediate","imediately":"immediately","importent":"important","libary":"library","liason":"liaison","neccessarily":"necessarily","occurencee":"occurrence","oppurtunity":"opportunity","paitent":"patient","paitents":"patients","practise":"practice","probly":"probably","realy":"really","reccomend":"recommend","recommand":"recommend","refference":"reference","relavent":"relevant","rember":"remember","restaraunt":"restaurant","seperateley":"separately","similiar":"similar","speach":"speech","sucess":"success","sucessfully":"successfully","tought":"thought","truelyy":"truly","usefull":"useful","wich":"which","witout":"without","writtingg":"writing","yesturday":"yesterday"};
const ALL_SUB_WORDS = {
  cardiology: ["arrhythmia","bradycardia","tachycardia","myocardium","pericardium","endocardium","atherosclerosis","arteriosclerosis","cardiomyopathy","hypertension","hypotension","infarction","angina","aneurysm","ischemia","ischemic","thrombosis","embolism","ventricle","atrium","aorta","aortic","mitral","tricuspid","pulmonary","pericarditis","cardiac","cardiovascular","electrocardiogram","echocardiogram","defibrillation","troponin","dyspnea","palpitation","auscultation","murmur","stenosis","regurgitation","asystole","syncope","edema","orthopnea","cardiomegaly","vasculitis","carotid","subclavian","pneumonia","asthma","bronchitis","bronchiolitis","pneumothorax","atelectasis","pleurisy","alveoli","bronchus","trachea","diaphragm","hypoxia","hypoxemia","stridor","spirometry"],
  pharmacology: ["acetaminophen","acyclovir","albuterol","alendronate","allopurinol","alprazolam","amiodarone","amitriptyline","amlodipine","amoxicillin","ampicillin","anastrozole","apixaban","aspirin","atenolol","atorvastatin","azathioprine","azithromycin","baclofen","benazepril","bethanechol","bisacodyl","bismuth","bisoprolol","buprenorphine","bupropion","buspirone","calcitonin","captopril","carbamazepine","carbidopa","carvedilol","cefaclor","cefazolin","cefepime","cefixime","cefotaxime","cefoxitin","cefpodoxime","ceftazidime","ceftriaxone","cefuroxime","celecoxib","cephalexin","chlorhexidine","chloroquine","chlorpromazine","chlorthalidone","ciprofloxacin","citalopram","clarithromycin","clindamycin","clobetasol","clonazepam","clonidine","clopidogrel","clotrimazole","clozapine","codeine","colchicine","cyclobenzaprine","cyclosporine","dapsone","daptomycin","darunavir","desipramine","desmopressin","dexamethasone","dextrose","diazepam","diclofenac","dicyclomine","digoxin","diltiazem","diphenhydramine","dobutamine","docusate","donepezil","dopamine","doxazosin","doxycycline","duloxetine","enalapril","enoxaparin","epinephrine","eplerenone","ergocalciferol","erythromycin","escitalopram","esomeprazole","estradiol","etanercept","ethambutol","etomidate","famotidine","febuxostat","felodipine","fentanyl","ferrous","finasteride","flecainide","fluconazole","fludrocortisone","fluoxetine","fluticasone","folic","fomepizole","fondaparinux","formoterol","furosemide","gabapentin","galantamine","gentamicin","glimepiride","glipizide","glucagon","glyburide","haloperidol","heparin","hydralazine","hydrochlorothiazide","hydrocodone","hydrocortisone","hydromorphone","hydroxychloroquine","hydroxyurea","hydroxyzine","hyoscyamine","ibuprofen","imatinib","imipenem","imipramine","indomethacin","infliximab","insulin","ipratropium","irbesartan","isoniazid","isosorbide","itraconazole","ivermectin","ketamine","ketoconazole","ketorolac","labetalol","lactulose","lamivudine","lamotrigine","lansoprazole","leflunomide","letrozole","levalbuterol","levetiracetam","levofloxacin","levothyroxine","lidocaine","linagliptin","linezolid","liothyronine","liraglutide","lisinopril","lithium","loperamide","loratadine","lorazepam","losartan","lovastatin","magnesium","mannitol","meclizine","medroxyprogesterone","meloxicam","memantine","meperidine","mercaptopurine","meropenem","mesalamine","metformin","methadone","methimazole","methotrexate","methyldopa","methylprednisolone","metoclopramide","metolazone","metoprolol","metronidazole","micafungin","midazolam","milrinone","minocycline","mirtazapine","misoprostol","modafinil","mometasone","montelukast","morphine","moxifloxacin","mupirocin","mycophenolate","naloxone","naltrexone","naproxen","naratriptan","neomycin","nicardipine","nifedipine","nitrofurantoin","nitroglycerin","nitroprusside","norepinephrine","nortriptyline","nystatin","octreotide","olanzapine","olmesartan","omeprazole","ondansetron","oseltamivir","oxacillin","oxcarbazepine","oxybutynin","oxycodone","oxytocin","pantoprazole","paracetamol","paroxetine","penicillin","pentobarbital","pentoxifylline","perindopril","phenobarbital","phenylephrine","phenytoin","piperacillin","pioglitazone","piroxicam","potassium","pramipexole","prasugrel","pravastatin","prazosin","prednisolone","prednisone","pregabalin","procainamide","promethazine","propofol","propranolol","propylthiouracil","protamine","pyridoxine","quetiapine","quinapril","raloxifene","ramipril","ranitidine","remifentanil","rifampin","risperidone","ritonavir","rituximab","rivaroxaban","rivastigmine","rocuronium","ropinirole","rosuvastatin","salmeterol","scopolamine","selegiline","sertraline","sildenafil","simvastatin","sirolimus","solifenacin","spironolactone","succinylcholine","sucralfate","sulfamethoxazole","sulfasalazine","sumatriptan","tacrolimus","tadalafil","tamoxifen","tamsulosin","tazobactam","temazepam","tenofovir","terazosin","terbinafine","terbutaline","thiamine","ticagrelor","timolol","tiotropium","tobramycin","tolterodine","topiramate","torsemide","tramadol","trazodone","triamcinolone","triamterene","trimethoprim","valacyclovir","valganciclovir","valproate","valproic","valsartan","vancomycin","varenicline","vasopressin","vecuronium","venlafaxine","verapamil","voriconazole","warfarin","zidovudine","ziprasidone","zoledronic","zolpidem"],
  surgery: ["laparoscopy","laparoscopic","cholecystectomy","appendectomy","craniotomy","tracheostomy","thoracentesis","paracentesis","arthroplasty","arthroscopy","endoscopy","colonoscopy","bronchoscopy","biopsy","resection","amputation","anastomosis","angioplasty","cannulation","catheterization","debridement","dissection","excision","extubation","intubation","fluoroscopy","fundoscopy","hemodialysis","hysterectomy","incision","infusion","lithotripsy","lobectomy","mammography","mastectomy","nephrectomy","nephrostomy","oophorectomy","ophthalmoscopy","pleurodesis","polypectomy","radiography","radiology","radiotherapy","sigmoidoscopy","stenting","thoracotomy","thrombolysis","transfusion","venipuncture","ventilation","ventriculostomy","anesthesia","catheter","auscultation"],
  neurology: ["encephalopathy","encephalitis","meningitis","neuropathy","radiculopathy","epilepsy","seizure","alzheimer","parkinson","dementia","ataxia","aphasia","paresthesia","cerebellum","cerebrum","brainstem","meninges","cerebrospinal","craniotomy","concussion","dystonia","dystrophy","myasthenia","schizophrenia","depression","anxiety","insomnia","myopathy","chorea","astrocytoma","glioblastoma","tinnitus","vertigo","sciatica"],
  pathology: ["carcinoma","melanoma","lymphoma","leukemia","sarcoma","adenoma","metastasis","metastasize","neoplasm","biopsy","malignant","benign","chemotherapy","prognosis","etiology","pathogenesis","thrombocytopenia","erythrocyte","leukocyte","neutropenia","hematoma","hemochromatosis","hemolysis","hemophilia","hemorrhage","ketoacidosis","hypercalcemia","hypocalcemia","hyponatremia","hyperkalemia","hypokalemia","cirrhosis","cholelithiasis","diverticulitis","pancreatitis","cholecystitis","septicemia","bacteremia"],
  anatomy: ["abdomen","abdominal","acetabulum","acromion","adrenal","alveoli","amygdala","aorta","appendix","artery","atlas","atrium","axilla","biceps","bladder","brachial","bursa","calcaneus","capillary","carotid","carpal","cartilage","cecum","cerebellum","cervical","clavicle","coccyx","cochlea","colon","conjunctiva","cornea","cortex","deltoid","dermis","diaphragm","duodenum","endometrium","epidermis","epiglottis","epithelium","esophagus","femur","fibula","gallbladder","gluteus","hepatic","humerus","hypothalamus","ileum","ilium","jejunum","jugular","larynx","ligament","lumbar","mandible","maxilla","mesentery","metacarpal","metatarsal","myocardium","nephron","patella","pelvis","pericardium","peritoneum","pharynx","pituitary","placenta","platelet","pleura","prostate","pylorus","radius","rectum","renal","retina","sacrum","scapula","sinus","spleen","sternum","tendon","thalamus","thorax","thymus","thyroid","tibia","tonsil","trachea","ulna","ureter","urethra","uterus","vagus","ventricle","vertebra"]
};
const COMMON_ENGLISH_SUBSET = ["am","are","is","was","were","be","been","being","have","has","had","having","do","does","did","done","doing","can","could","will","would","shall","should","may","might","must","i","you","he","she","it","we","they","me","him","her","us","them","my","your","his","her","its","our","their","mine","yours","hers","ours","theirs","myself","yourself","himself","herself","itself","ourselves","themselves","who","whom","whose","which","what","whatever","whoever","whichever","this","that","these","those","and","or","but","nor","so","yet","for","as","if","because","since","although","though","even","while","whereas","unless","until","of","at","by","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","near","past","across","behind","beside","beyond","app","apps","application","applications","setting","settings","editor","note","notes","vault","plugin","plugins","custom","default","toggle","toggleable","toggled","mode","silent","underline","underlined","sensitivity","threshold","tier","tiers","level","proactive","balanced","strict","minimal","aggressive","export","import","download","file","files","folder","workspace","sidebar","ribbon","status","bar","button","click","hover","revert","undo","redo","text","word","words","letter","letters","minimum","maximum","lower","higher","decrease","increase","prevent","correct","corrected","correcting","correction","corrections","autocorrect","spellcheck","spellchecker","spelling","grammar","highlight","highlighted","real","already","example","examples","general","specific","specifically","check","checking","tested","testing","test","tests","rather","taking","fast","taking","making","mistake","mistakes","constantly","working","right","now","anything","nothing","something","everything","maybe","well","add","added","adding","delete","deleted","able","about","above","accept","accepted","according","account","across","act","action","active","activity","actual","actually","add","addition","additional","address","administer","admit","admitted","adult","advance","advanced","advice","advise","advised","affect","affects","affected","after","again","against","age","aged","agency","agent","ago","agree","agreed","ahead","air","all","allow","allowed","almost","alone","along","already","also","although","always","among","amount","analysis","and","animal","another","answer","answers","any","anybody","anymore","anyone","anything","anyway","anywhere","apart","apparent","apparently","appear","appeared","appears","apply","applied","approach","appropriate","area","areas","argue","argument","arm","arms","around","arrange","arrangement","arrive","arrived","arrives","art","article","artist","ask","asked","asking","asks","aspect","assessment","assist","assistance","associate","associated","assume","assumed","at","atmosphere","attach","attack","attempt","attend","attention","attitude","attorney","attract","audience","author","authority","available","average","avoid","avoided","aware","away","baby","back","background","bad","badly","bag","balance","ball","band","bank","bar","barely","barrel","barrier","base","baseball","basic","basically","basis","basket","battery","battle","be","beach","bean","bear","beat","beautiful","beauty","because","become","becomes","becoming","bed","bedroom","beer","before","begin","beginning","begins","begun","behavior","behind","being","belief","believe","believed","believes","bell","belong","below","belt","bench","bend","beneath","benefit","benefits","beside","besides","best","better","between","beyond","bible","big","bike","bill","billion","bind","biological","bird","birth","birthday","bit","bite","black","blade","blame","blanket","blind","block","blood","blow","blue","board","boat","body","bomb","bond","bone","bones","book","boom","boot","border","born","borrow","boss","both","bother","bottle","bottom","boundary","bowl","box","boy","boyfriend","brain","branch","brand","bread","break","breakfast","breast","breath","breathe","breathing","brick","bridge","brief","briefly","bright","brilliant","bring","brings","bringing","broad","broke","broken","brother","brown","brush","buck","budget","build","building","built","bullet","bunch","burn","bury","bus","business","busy","but","butter","button","buy","buyer","by","cabinet","cable","cake","calculate","call","called","calling","calls","calm","camera","camp","campaign","campus","can","cancer","candidate","cap","capacity","capital","captain","capture","car","card","care","career","careful","carefully","carrier","carry","carrying","case","cases","cash","cast","cat","catch","category","cause","caused","causes","causing","ceiling","celebrate","celebration","cell","cells","center","central","century","ceremony","certain","certainly","chain","chair","chairman","challenge","chamber","champion","championship","chance","change","changed","changes","changing","channel","chapter","character","characteristic","characterize","charge","charity","chart","chase","cheap","check","checked","checking","checks","cheek","cheese","chef","chemical","chest","chicken","chief","child","children","chin","chocolate","choice","choose","chosen","church","cigarette","circle","circumstance","cite","citizen","city","civil","claim","class","classic","classroom","clean","clear","clearly","clerk","clever","click","client","climate","climb","clinic","clinical","clock","close","closed","closely","closer","clothes","clothing","cloud","club","clue","cluster","coach","coal","coalition","coast","coat","code","coffee","cognitive","cold","collapse","colleague","collect","collection","collective","college","colonial","color","column","combination","combine","come","comes","comfort","comfortable","command","commander","comment","commercial","commission","commit","commitment","committee","common","commonly","communicate","communication","community","company","compare","comparison","compete","competition","competitive","competitor","complain","complaint","complete","completely","complex","complicated","component","compose","composition","comprehensive","computer","concentrate","concentration","concept","concern","concerned","concert","conclude","conclusion","concrete","condition","conditions","conduct","conference","confidence","confident","confirm","confirmed","conflict","confront","confusion","congress","congressional","connect","connection","consciousness","consensus","consequence","conservative","consider","considerable","consideration","consist","consistent","constant","constantly","constitute","constitutional","construct","construction","consultant","consume","consumer","consumption","contact","contain","container","contemporary","content","contest","context","continue","continued","continues","continuing","contract","contrast","contribute","contribution","control","controversial","controversy","convention","conventional","conversation","convert","conviction","convince","cook","cookie","cooking","cool","cooperation","cop","cope","copy","core","corn","corner","corporate","corporation","correct","correctly","correspondent","cost","costs","cotton","couch","could","council","counsel","counseling","counselor","count","counter","country","county","couple","courage","course","court","cousin","cover","coverage","covered","cow","crack","craft","crash","crazy","cream","create","created","creation","creative","creature","credit","crew","crime","criminal","crisis","criteria","critic","critical","criticism","criticize","crop","cross","crowd","crucial","cry","cultural","culture","cup","curious","current","currently","curriculum","custom","customer","cut","cycle","dad","daily","damage","dance","danger","dangerous","dare","dark","darkness","data","date","daughter","day","days","dead","deal","dealer","dear","death","debate","debt","decade","decide","decided","decision","deck","declare","decline","decrease","deep","deeply","deer","defeat","defend","defendant","defense","defensive","deficit","define","definitely","definition","degree","delay","deliver","delivery","demand","democracy","democrat","democratic","demonstrate","demonstration","deny","department","depend","dependent","depending","depict","depression","depth","deputy","derive","describe","described","description","desert","deserve","design","designer","desire","desk","desperate","despite","destroy","destruction","detail","detailed","detect","determine","develop","developing","development","device","devote","dialogue","diet","differ","difference","different","differently","difficult","difficulty","digital","dimension","dining","dinner","direct","direction","directly","director","dirt","dirty","disability","disagree","disappear","disaster","discipline","discourse","discover","discovery","discrimination","discuss","discussion","disease","dish","dismiss","disorder","display","dispute","distance","distant","distinct","distinction","distinguish","distribute","distribution","district","diverse","diversity","divide","division","divorce","dna","do","doctor","document","dog","domestic","dominant","dominate","door","double","doubt","down","downtown","dozen","draft","drag","drama","dramatic","dramatically","draw","drawing","dream","dress","drink","drive","driver","drop","drug","dry","due","during","dust","duty","each","eager","ear","early","earn","earnings","earth","ease","easily","east","eastern","easy","eat","economic","economics","economist","economy","edge","edition","editor","educate","education","educational","educator","effect","effective","effectively","efficiency","efficient","effort","egg","eight","either","elderly","elect","election","electric","electricity","electronic","element","elementary","eliminate","elite","else","elsewhere","email","embrace","emerge","emergency","emission","emotion","emotional","emphasis","emphasize","employ","employee","employer","employment","empty","enable","encounter","encourage","end","enemy","energy","enforcement","engage","engine","engineer","engineering","english","enhance","enjoy","enormous","enough","ensure","enter","enterprise","entertainment","entire","entirely","entrance","entry","environment","environmental","episode","equal","equally","equipment","era","error","escape","especially","essay","essential","essentially","establish","establishment","estate","estimate","etc","ethics","ethnic","european","evaluate","evaluation","even","evening","event","eventually","ever","every","everybody","everyday","everyone","everything","everywhere","evidence","evolution","evolve","exact","exactly","examination","examine","example","exceed","excellent","except","exception","exchange","exciting","executive","exercise","exhibit","exhibition","exist","existence","existing","expand","expansion","expect","expectation","expense","expensive","experience","experiment","expert","explain","explanation","explode","explore","explosion","expose","exposure","express","expression","extend","extension","extensive","extent","external","extra","extraordinary","extreme","extremely","eye","fabric","face","facility","fact","factor","factory","faculty","fade","fail","failure","fair","fairly","faith","fall","false","familiar","family","famous","fan","fantasy","far","farm","farmer","fashion","fast","fat","fate","father","fault","favor","favorite","fear","feature","federal","fee","feed","feel","feeling","fellow","female","fence","few","fewer","fiber","fiction","field","fifteen","fifth","fifty","fight","fighter","fighting","figure","file","fill","film","final","finally","finance","financial","find","finding","fine","finger","finish","fire","firm","first","fish","fishing","fit","fitness","five","fix","flag","flame","flat","flavor","flee","flesh","flight","float","floor","flow","flower","fly","focus","folk","follow","following","food","foot","football","for","force","foreign","forest","forever","forget","form","formal","formation","former","formula","forth","fortune","forward","found","foundation","founder","four","fourth","frame","framework","free","freedom","freeze","french","frequency","frequent","frequently","fresh","friend","friendly","friendship","from","front","fruit","frustration","fuel","full","fully","fun","function","fund","fundamental","funding","funeral","funny","furniture","further","future","gain","galaxy","gallery","game","gang","gap","garage","garden","garlic","gas","gate","gather","gaze","gear","gender","gene","general","generally","generate","generation","genetic","gentleman","gently","german","gesture","get","ghost","giant","gift","gifted","girl","girlfriend","give","given","glad","glance","glass","global","glove","go","goal","god","gold","golden","golf","good","government","governor","grab","grade","gradually","graduate","grain","grand","grandfather","grandmother","grant","grass","grave","gray","great","greatest","green","grocery","ground","group","grow","growing","growth","guarantee","guard","guess","guest","guide","guideline","guilty","gun","guy","habit","habitat","hair","half","hall","hand","handful","handle","hang","happen","happened","happy","hard","hardly","hat","hate","have","he","head","headline","headquarters","health","healthy","hear","hearing","heart","heat","heaven","heavily","heavy","heel","height","helicopter","hell","hello","help","helpful","her","here","heritage","hero","herself","hide","high","highlight","highly","highway","hill","him","himself","hip","hire","his","historian","historic","historical","history","hit","hold","hole","holiday","holy","home","homeless","honest","honey","honor","hope","horizon","horror","horse","hospital","host","hot","hotel","hour","house","household","housing","how","however","huge","human","humor","hundred","hungry","hunter","hunting","hurt","husband","hypothesis","ice","idea","ideal","identification","identify","identity","ie","if","ignore","ill","illegal","illness","illustrate","image","imagination","imagine","immediate","immediately","immigrant","immigration","impact","implement","implication","imply","importance","important","impose","impossible","impress","impression","impressive","improve","improved","improvement","in","incentive","incident","include","including","income","incorporate","increase","increased","increasing","increasingly","incredible","indeed","independence","independent","index","indian","indicate","indication","individual","industrial","industry","infant","infection","inflation","influence","inform","information","ingredient","initial","initially","initiative","injury","inner","innocent","inquiry","inside","insight","insist","inspire","install","instance","instead","institution","institutional","instruction","instructor","instrument","insurance","intellectual","intelligence","intend","intense","intensity","intention","interaction","interest","interested","interesting","internal","international","internet","interpret","interpretation","intervention","interview","into","introduce","introduction","invasion","invest","investigate","investigation","investigator","investment","investor","invite","involve","involved","involvement","iraqi","irish","iron","islamic","island","israeli","issue","it","italian","item","its","itself","jacket","jail","japanese","jet","jew","jewish","job","join","joint","joke","journal","journalist"];
const CLINICAL_ACRONYMS = new Set([
  'soap', 'stat', 'prn', 'mg', 'mcg', 'ml', 'bpm', 'mmhg', 'ecg', 'ekg', 'eeg',
  'mri', 'ct', 'cxr', 'cbc', 'bmp', 'cmp', 'ua', 'bun', 'cr', 'hgb', 'hct',
  'wbc', 'rbc', 'plt', 'inr', 'pt', 'ptt', 'gfr', 'ast', 'alt', 'alp', 'troponin',
  'bnp', 'abg', 'spo2', 'o2', 'iv', 'im', 'sc', 'po', 'bid', 'tid', 'qid', 'qhs',
  'npo', 'hx', 'dx', 'tx', 'rx', 'sx', 'fx', 'sob', 'bp', 'hr', 'rr', 'temp'
]);

function getDamerauDistance(a, b) {
  const al = a.length, bl = b.length;
  if (Math.abs(al - bl) > 3) return 99;
  const d = [];
  for (let i = 0; i <= al; i++) d[i] = [i];
  for (let j = 0; j <= bl; j++) d[0][j] = j;
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[al][bl];
}

// ---------------------------------------------------------------------------
// Auto-correct engine (Word-style)
//
// How it decides, in order (first rule that produces a change wins, then the
// capitalisation pass is layered on top of whatever came out):
//   1. Table fixes   - custom replacements, clinical shorthands, typo tables.
//                      Deterministic, like Word's AutoCorrect list. No threshold.
//   2. Case rules    - solitary i, TWo INitial CApitals.
//   3. Spell-check   - only for words that are NOT in any dictionary AND that the
//                      system spell-checker also rejects. Candidates are scored and
//                      must clear the tier threshold AND beat the runner-up by a
//                      margin (ambiguous words are left alone, like Word).
//   4. Sentence caps - first word of a sentence / line / list item.
// ---------------------------------------------------------------------------

const SENSITIVITY_TIERS = ["ultra", "proactive", "balanced", "strict", "minimal"];

// threshold = minimum confidence (0-1). minMargin = lead the best candidate must have
// over the runner-up. minLen = shortest word the spell-checker path may touch.
// d2MinLen = shortest word allowed to take a 2-edit correction.
// "minimal" has no entry: tables only, the spell-checker path is off.
const TIER_CONFIG = {
  ultra: { threshold: 0.35, minMargin: 0.0, minLen: 3, d2MinLen: 5 },
  proactive: { threshold: 0.45, minMargin: 0.03, minLen: 4, d2MinLen: 6 },
  balanced: { threshold: 0.52, minMargin: 0.05, minLen: 4, d2MinLen: 6 },
  strict: { threshold: 0.68, minMargin: 0.08, minLen: 4, d2MinLen: 7 }
};

// Triggers. "full" = every rule runs. "table" = only deterministic fixes (these
// characters are too often part of URLs, filenames, times, list numbering, etc.).
const VIEW_TYPE_CORRECTIONS = "silent-autocorrect-corrections";
const LOG_LIMIT = 200; // corrections kept in the side panel
const INFO = (kind, label, confidence, canAdd = false) => ({ kind, label, confidence, canAdd });
const FULL_TRIGGERS = new Set([" ", "Enter", ",", ";", "!", "?"]);
const TABLE_TRIGGERS = new Set([".", ":", ")", "]"]);

// Valid in NZ/UK English (or real words) - never rewrite these from the tables.
const TABLE_EXCLUDE = new Set(["defiantly", "practise", "judgement"]);

// Scheme / tool words that precede ":" or "." in URLs and should never be "fixed".
const ALWAYS_KNOWN = ["http", "https", "ftp", "www", "mailto", "obsidian", "md", "png", "jpg", "pdf"];

const ABBREVIATIONS = new Set([
  "e.g", "i.e", "etc", "vs", "cf", "viz", "approx", "dr", "mr", "mrs", "ms", "prof",
  "fig", "figs", "eq", "eqs", "vol", "vols", "ch", "sec", "pp", "al", "inc", "ltd",
  "dept", "est", "ca", "ref", "refs", "a.m", "p.m", "u.s", "u.k"
]);

const KEY_ROWS = [
  { keys: "qwertyuiop", offset: 0 },
  { keys: "asdfghjkl", offset: 0.25 },
  { keys: "zxcvbnm", offset: 0.75 }
];
const KEY_POS = {};
KEY_ROWS.forEach((row, r) => {
  [...row.keys].forEach((k, c) => (KEY_POS[k] = { r, x: c + row.offset }));
});

const own = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);

function keysAdjacent(a, b) {
  const p = KEY_POS[a], q = KEY_POS[b];
  if (!p || !q) return false;
  return Math.abs(p.r - q.r) <= 1 && Math.abs(p.x - q.x) <= 1.1;
}

function matchCase(original, replacement) {
  if (original.length > 1 && /[A-Z]/.test(original) && original === original.toUpperCase() && !replacement.includes(" ")) {
    return replacement.toUpperCase();
  }
  if (/^[A-Z]/.test(original)) return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  return replacement;
}

// UK/NZ <-> US spelling folding, so "oedema"/"edema", "anaesthesia"/"anesthesia",
// "colour"/"color", "organise"/"organize" are never "corrected" into each other.
function foldVariants(s) {
  return s
    .replace(/ae/g, "e")
    .replace(/oe/g, "e")
    .replace(/ou(?=r)/g, "o")
    .replace(/is(?=e\b|ed\b|es\b|ing\b|ation)/g, "iz")
    .replace(/ys(?=e\b|ed\b|es\b|ing\b)/g, "yz")
    .replace(/tre\b/g, "ter")
    .replace(/ogue\b/g, "og");
}

// Describes a single-edit difference (typed -> candidate) so we can reward the
// classic typo shapes (swapped neighbours, adjacent-key slip, doubled letter).
function classifySingleEdit(a, b) {
  if (a.length === b.length) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (i < a.length - 1 && a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) {
      return { type: "transposition", index: i, end: i + 2 };
    }
    if (a.slice(i + 1) === b.slice(i + 1)) {
      return { type: "substitution", index: i, end: i + 1, from: a[i], to: b[i] };
    }
  } else if (a.length === b.length + 1) {
    let i = 0;
    while (i < b.length && a[i] === b[i]) i++;
    if (a.slice(i + 1) === b.slice(i)) {
      return { type: "extra", index: i, end: i + 1, doubled: a[i] === a[i - 1] || a[i] === a[i + 1] };
    }
  } else if (b.length === a.length + 1) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (b.slice(i + 1) === a.slice(i)) {
      return { type: "missing", index: i, end: i + 1, doubled: b[i] === b[i - 1] || b[i] === b[i + 1] };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Frequency data (SymSpell-format files, optional). Obsidian only installs main.js,
// manifest.json and styles.css, so these two files are downloaded on request (see
// downloadFrequencyData) into the plugin folder. Without them the plugin still works.
//   unigrams: "word count"            bigrams: "word1 word2 count"
// ---------------------------------------------------------------------------
const FREQ_UNIGRAM_FILE = "frequency_dictionary_en_82_765.txt";
const FREQ_BIGRAM_FILE = "frequency_bigramdictionary_en_243_342.txt";
// Only network use in this plugin: a one-off, user-approved GET of these two public files.
// No note content or user data is ever sent. Change this to host the files yourself.
const FREQ_DOWNLOAD_BASE = "https://raw.githubusercontent.com/wolfgarbe/SymSpell/master/SymSpell/";
const FREQ_FILES = [
  { name: FREQ_UNIGRAM_FILE, minParts: 2 },
  { name: FREQ_BIGRAM_FILE, minParts: 3 },
];
// Cheap sanity check so an HTML error page never gets saved as a dictionary.
function looksLikeFrequencyFile(text, minParts) {
  if (typeof text !== "string" || text.length < 100000) return false;
  const lines = text.split("\n", 6).filter((l) => l.trim());
  if (lines.length < 3) return false;
  return lines.every((l) => {
    const parts = l.trim().split(/\s+/);
    const count = Number(parts[parts.length - 1]);
    return parts.length >= minParts && Number.isFinite(count) && count > 0;
  });
}
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

class FrequencyModel {
  constructor(topN = 50000) {
    this.topN = topN;
    this.uni = new Map(); // word -> count
    this.rankMap = new Map(); // word -> 1-based rank (1 = most frequent)
    this.byFirst = new Map(); // first letter -> common words starting with it
    this.bi = new Map(); // "a b" -> count
    this.total = 0;
    this.ready = false; // unigrams loaded
    this.hasBigrams = false;
  }

  async loadUnigrams(text) {
    const entries = [];
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const p = lines[i].trim().split(/\s+/);
      if (p.length >= 2) {
        const w = p[0].toLowerCase();
        const c = Number(p[1]);
        if (/^[a-z]+$/.test(w) && c > 0) entries.push([w, c]);
      }
      if (i % 30000 === 29999) await nextTick(); // keep Obsidian responsive
    }
    entries.sort((a, b) => b[1] - a[1]);
    this.uni = new Map();
    this.rankMap = new Map();
    this.byFirst = new Map();
    this.total = 0;
    entries.forEach(([w, c], i) => {
      if (this.uni.has(w)) return;
      this.uni.set(w, c);
      this.rankMap.set(w, i + 1);
      this.total += c;
      if (i < this.topN) {
        const list = this.byFirst.get(w[0]);
        if (list) list.push(w);
        else this.byFirst.set(w[0], [w]);
      }
    });
    this.ready = this.uni.size > 0;
  }

  async loadBigrams(text) {
    const bi = new Map();
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const p = lines[i].trim().split(/\s+/);
      if (p.length >= 3) {
        const c = Number(p[2]);
        if (c > 0) bi.set(p[0].toLowerCase() + " " + p[1].toLowerCase(), c);
      }
      if (i % 40000 === 39999) await nextTick();
    }
    this.bi = bi;
    this.hasBigrams = bi.size > 0;
  }

  has(w) { return this.uni.has(w); }
  count(w) { return this.uni.get(w) || 0; }
  rank(w) { return this.rankMap.get(w) || Infinity; }
  isCommon(w) { return this.rank(w) <= this.topN; }
  bigram(a, b) { return this.bi.get(a + " " + b) || 0; }

  // Observed bigram count, or a deliberately pessimistic independence estimate.
  pairScore(a, b) {
    const obs = this.bigram(a, b);
    if (obs) return obs;
    return ((this.count(a) || 1) * (this.count(b) || 1) / Math.max(this.total, 1)) * 0.05;
  }

  // Common words that could plausibly be a mistyping of `lower` (cheap prefilter only).
  candidates(lower) {
    const out = [];
    const firsts = new Set([lower[0]]);
    if (lower.length > 1) firsts.add(lower[1]); // a swap of the first two letters
    for (const f of firsts) {
      const list = this.byFirst.get(f);
      if (!list) continue;
      for (const w of list) if (Math.abs(w.length - lower.length) <= 2) out.push(w);
    }
    return out;
  }
}

class AutoCorrectEngine {
  constructor(getSettings, getOracle) {
    this.getSettings = getSettings;
    this.getOracle = getOracle || (() => null);
    this.rejected = new Set(); // words the user reverted this session
    this.freq = null; // FrequencyModel, once loaded
    this.domainWords = new Set(); // medical / custom terms and clinical acronyms
    this.knownWords = new Set();
    this.poolWords = [];
    this.typoTable = new Map();
    this.typoOrigin = new Map(); // typo -> "english" | "medical"
  }

  // Rebuild lookup structures. Call after any settings / dictionary change.
  rebuild() {
    const S = this.getSettings();
    const known = new Set(ALWAYS_KNOWN);
    const pool = new Set();

    // Every built-in specialty list counts as "known" (never touched), even if the
    // specialty is toggled off; only ENABLED ones feed suggestions.
    for (const [id, list] of Object.entries(ALL_SUB_WORDS)) {
      const enabled = !!(S.subDictionaries && S.subDictionaries[id] && S.subDictionaries[id].enabled);
      for (const w of list) {
        known.add(w);
        if (enabled) pool.add(w);
      }
    }
    for (const w of COMMON_ENGLISH_SUBSET) known.add(w);

    const addCustom = (w) => {
      const lw = String(w).trim().toLowerCase();
      if (!lw) return;
      known.add(lw);
      pool.add(lw);
    };
    (S.customWords || []).forEach(addCustom);
    Object.values(S.customSubWords || {}).forEach((list) => (list || []).forEach(addCustom));

    // Typo tables (identity rows dropped; user-protected words win over the tables).
    const table = new Map();
    const origin = new Map();
    const contractions = S.fixCommonContractions !== false;
    if (S.enableEnglishDict !== false) {
      for (const [k, v] of Object.entries(ENGLISH_TYPOS)) {
        if (k === v || TABLE_EXCLUDE.has(k)) continue;
        if (!contractions && v.includes("'")) continue;
        table.set(k, v);
        origin.set(k, "english");
      }
    }
    for (const [k, v] of Object.entries(MEDICAL_TYPOS)) {
      if (k !== v) {
        table.set(k, v);
        origin.set(k, "medical");
      }
    }
    const customOnly = new Set();
    (S.customWords || []).forEach((w) => customOnly.add(String(w).toLowerCase()));
    Object.values(S.customSubWords || {}).forEach((l) => (l || []).forEach((w) => customOnly.add(String(w).toLowerCase())));
    for (const k of [...table.keys()]) if (customOnly.has(k)) table.delete(k);

    const domain = new Set(CLINICAL_ACRONYMS);
    Object.values(ALL_SUB_WORDS).forEach((l) => l.forEach((w) => domain.add(w)));
    customOnly.forEach((w) => domain.add(w));
    this.domainWords = domain;

    this.knownWords = known;
    this.poolWords = [...pool];
    this.typoTable = table;
    this.typoOrigin = origin;
  }

  // True if the word (or a simple inflection of it) is in any dictionary we hold.
  isKnown(lower) {
    if (!lower || lower.length <= 1) return true;
    if (/\d/.test(lower)) return true;
    if (CLINICAL_ACRONYMS.has(lower) || this.knownWords.has(lower)) return true;
    const fr = this.freqReady() ? this.freq : null;
    if (fr && fr.has(lower)) return true;
    const folded = foldVariants(lower); // colour -> color, oedema -> edema, organise -> organize
    if (folded !== lower && (this.knownWords.has(folded) || (fr && fr.has(folded)))) return true;
    const rules = [["'s", ""], ["s", ""], ["es", ""], ["ed", ""], ["d", ""], ["ing", ""], ["ing", "e"], ["ies", "y"], ["ly", ""]];
    for (const [suffix, add] of rules) {
      if (lower.endsWith(suffix)) {
        const stem = lower.slice(0, lower.length - suffix.length) + add;
        if (stem.length >= 3 && (this.knownWords.has(stem) || (fr && fr.has(stem)))) return true;
      }
    }
    return false;
  }

  // true = valid, false = misspelled, null = no system spell-checker available.
  spellState(word) {
    const oracle = this.getOracle();
    if (!oracle) return null;
    try {
      return !oracle.isMisspelled(word);
    } catch (e) {
      return null;
    }
  }

  isSentenceStart(textBefore) {
    const LINE_PREFIX = /^\s*(?:>\s*)*(?:(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX\/\-]\]\s+)?|#{1,6}\s+)?/;
    const prefix = textBefore.match(LINE_PREFIX)[0];
    const rest = textBefore.slice(prefix.length);
    if (rest === "") return true;

    const m = rest.match(/(\S+?)([.!?]+)["')\]\u201d\u2019]*\s+$/u);
    if (!m) return false;
    if (m[2].includes(".") && m[2].length === 1) {
      const tok = m[1].toLowerCase().replace(/^[("'\[\u201c\u2018]+/, "");
      if (ABBREVIATIONS.has(tok)) return false;
      if (/^\p{L}$/u.test(tok)) return false; // initials, "a.", "b."
      if (/^(?:\p{L}\.)+\p{L}$/u.test(tok)) return false; // e.g. "u.s"
    }
    return true;
  }

  // Score one candidate (typed -> cand), both lowercase. Returns {score, intrinsic} (0..1) or null if ineligible.
  scoreCandidate(typed, cand, source, rank, cfg) {
    if (typed === cand) return null;
    const d = getDamerauDistance(typed, cand);
    if (d < 1 || d > 2) return null;
    const L = Math.max(typed.length, cand.length);
    if (d === 2 && typed.length < cfg.d2MinLen) return null;
    if (foldVariants(typed) === foldVariants(cand)) return null; // regional spelling, not a typo
    if (typed.length > cand.length && typed.startsWith(cand)) return null; // typed = candidate + suffix

    let s = d === 1 ? 0.55 : 0.25;
    s += Math.min(0.18, Math.max(0, (L - 4) * 0.03));

    const sameFirst = typed[0] === cand[0];
    const swappedStart = typed.length > 1 && typed[0] === cand[1] && typed[1] === cand[0];
    if (sameFirst) s += 0.12;
    else if (!swappedStart) s -= 0.3;

    if (d === 1) {
      const e = classifySingleEdit(typed, cand);
      if (e) {
        const inTail = e.index >= typed.length - 2 && typed.length >= 6;
        if (inTail && (e.type === "substitution" || (e.type === "transposition" && typed.length < 7))) return null; // likely a suffix variant
        if (e.type === "transposition") s += 0.12;
        else if (e.type === "substitution" && keysAdjacent(e.from, e.to)) s += 0.06;
        else if ((e.type === "extra" || e.type === "missing") && e.doubled) s += 0.06;
      }
    }

    // "intrinsic" = how typo-like the edit is. Source / suggestion rank only add prior
    // belief on top; they break ties but never count as evidence when judging ambiguity.
    const intrinsic = Math.max(0, Math.min(1, s));
    if (this.freqReady()) {
      const fc = this.freq.count(cand);
      if (fc) s += Math.max(0, Math.min(1, (Math.log10(fc) - 4) / 6)) * 0.1; // common words are likelier targets
    }
    if (source === "dict") s += 0.08;
    else if (rank === 0) s += 0.05;
    else if (rank === 1) s += 0.02;

    return { score: Math.max(0, Math.min(1, s)), intrinsic };
  }

  freqReady() {
    const S = this.getSettings();
    return !!(this.freq && this.freq.ready && S.useFrequencyDictionary !== false);
  }

  setFrequency(model) {
    this.freq = model;
  }

  // Best single correction for an unknown word, or null.
  // opts.transpositionOnly: 3-letter words may only be fixed by swapping two neighbouring
  // letters into a very common word ("hte" -> "the").
  suggest(word, lower, cfg, opts = {}) {
    const oracle = this.getOracle();
    const F = this.freqReady() ? this.freq : null;
    const cands = new Map(); // word -> {word, score, intrinsic, count}

    let effCfg = cfg;
    const consider = (cand, source, rank) => {
      const sc = this.scoreCandidate(lower, cand, source, rank, effCfg);
      if (sc === null) return;
      const prev = cands.get(cand);
      if (!prev) cands.set(cand, { word: cand, score: sc.score, intrinsic: sc.intrinsic, source, count: F ? F.count(cand) : 0 });
      else {
        if (sc.score > prev.score) prev.source = source;
        prev.score = Math.max(prev.score, sc.score);
        prev.intrinsic = Math.max(prev.intrinsic, sc.intrinsic);
      }
    };
    const poolHits = () => this.poolWords.filter((w) => Math.abs(w.length - lower.length) <= 2);

    if (opts.transpositionOnly) {
      if (!F) return null;
      for (const w of F.candidates(lower)) {
        if (w.length !== 3 || F.rank(w) > 3000) continue;
        const e = classifySingleEdit(lower, w);
        if (e && e.type === "transposition") consider(w, "freq", -1);
      }
    } else if (oracle) {
      let sugg = [];
      try {
        sugg = (oracle.suggest(word) || []).slice(0, 10);
      } catch (e) {}
      // Suggestion that only differs by capitalisation => just a proper noun / acronym.
      for (const sg of sugg) if (String(sg).toLowerCase() === lower) return null;
      poolHits().forEach((w) => consider(w, "dict", -1));
      if (F) F.candidates(lower).forEach((w) => consider(w, "freq", -1));
      sugg.forEach((sg, i) => {
        const ls = String(sg).toLowerCase();
        if (/^[a-z]+$/.test(ls)) consider(ls, "system", i);
      });
    } else if (F) {
      // No system spell-checker, but the frequency dictionary tells us what real words are.
      // It can't list every valid word, so without a second opinion only one-edit fixes are allowed.
      effCfg = Object.assign({}, cfg, { d2MinLen: Infinity });
      poolHits().forEach((w) => consider(w, "dict", -1));
      F.candidates(lower).forEach((w) => consider(w, "freq", -1));
    } else {
      // Neither: we can't tell a typo from a real word we don't list, so only accept
      // long swapped-letter slips of listed terms.
      if (lower.length < 8) return null;
      for (const w of this.poolWords) {
        if (w.length !== lower.length) continue;
        const e = getDamerauDistance(lower, w) === 1 ? classifySingleEdit(lower, w) : null;
        if (e && e.type === "transposition") consider(w, "dict", -1);
      }
    }

    if (cands.size === 0) return null;
    const ranked = [...cands.values()].sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (best.score < cfg.threshold) return null;
    // Rivals that fit the typo about as well as the winner make it ambiguous. Frequency can
    // settle that, but only if the winner is overwhelmingly the more common word.
    const close = ranked.slice(1).filter((c) => best.intrinsic - c.intrinsic < cfg.minMargin);
    if (close.length) {
      const settled = F && best.count > 0 && close.every((c) => best.count >= 50 * Math.max(c.count, 1));
      if (!settled) return null;
    }
    return { word: best.word, score: best.score, source: best.source };
  }

  // Word-boundary slips, using the frequency data:
  //   "ism y" -> "is my"   (letters slid across a space)
  //   "inthe" -> "in the"  (two words run together)
  //   "wh at" -> "what"    (one word broken in two)
  // Returns {start, end, replacement, original} (offsets into textBefore) or null.
  fixBoundaries(textBefore, start, end, word, lower) {
    const S = this.getSettings();
    if (S.fixSplitMergeErrors === false || !this.freqReady()) return null;
    const F = this.freq;
    if (!/^[a-z]+$/.test(lower) || lower.length > 20) return null;
    if (word !== lower && !/^[A-Z][a-z]*$/.test(word)) return null; // lowercase or Capitalised only
    if (this.typoTable.has(lower)) return null;

    const domain = (t) => this.domainWords.has(t) || ABBREVIATIONS.has(t);
    const wordish = (t) => F.isCommon(t) || domain(t);
    const lone = (t) => t.length === 1 && t !== "a" && t !== "i";

    const finish = (s0, e0, replacement, confidence) => {
      const original = textBefore.slice(s0, e0);
      if (this.rejected.has(original.toLowerCase())) return null;
      let r = matchCase(original, replacement);
      if (
        S.capitalizeFirstLetterSentences !== false &&
        /^[a-z]/.test(r) &&
        this.isSentenceStart(textBefore.slice(0, s0))
      ) {
        r = r.charAt(0).toUpperCase() + r.slice(1);
      }
      return r === original ? null : { start: s0, end: e0, replacement: r, original, ...INFO("spacing", "SPACING", confidence) };
    };

    // Pair of words: the previous word + this one.
    if (!domain(lower)) {
      const before = textBefore.slice(0, start);
      const m = before.match(/(^|[\s(\["\u201c\u2018*_~=>\-])(\p{L}+) $/u);
      if (m) {
        const raw1 = m[2];
        const t1 = raw1.toLowerCase();
        const okShape = raw1 === t1 || /^[A-Z][a-z]*$/.test(raw1);
        if (okShape && /^[a-z]+$/.test(t1) && !domain(t1) && !this.typoTable.has(t1)) {
          const suspicious = lone(t1) || lone(lower) || !wordish(t1) || !wordish(lower);
          if (suspicious) {
            const s1 = before.length - 1 - raw1.length;
            const concat = t1 + lower;
            // One word broken in two: only when at least one half isn't a word on its own.
            if (!(wordish(t1) && wordish(lower)) && (F.isCommon(concat) || this.domainWords.has(concat))) {
              const r = finish(s1, end, concat, 0.9);
              if (r) return r;
            }
            // Letters slid across the space: re-split the joined text.
            if (F.hasBigrams && concat.length >= 4 && concat.length <= 24) {
              const orig = F.pairScore(t1, lower);
              const best = this.bestSplit(concat, t1.length);
              if (best && best.count >= 20 * orig) {
                const ratio = best.count / Math.max(orig, 1e-9);
                const r = finish(s1, end, best.a + " " + best.b, Math.min(0.99, 0.85 + 0.04 * Math.log10(ratio / 20)));
                if (r) return r;
              }
            }
          }
        }
      }
    }

    // One unknown word that is really two run together.
    if (F.hasBigrams && lower.length >= 5 && !domain(lower) && !this.isKnown(lower) && this.spellState(word) !== true) {
      const best = this.bestSplit(lower, -1);
      if (best) {
        const conf = best.second ? Math.min(0.99, 0.8 + 0.05 * Math.log10(best.count / best.second)) : 0.92;
        return finish(start, end, best.a + " " + best.b, conf);
      }
    }
    return null;
  }

  splitPartOk(t) {
    const F = this.freq;
    if (t.length === 1) return t === "a" || t === "i";
    if (t.length === 2) return F.rank(t) <= 1000;
    return F.isCommon(t);
  }

  // Best way to cut `joined` into two common words that actually occur together.
  bestSplit(joined, skipIndex) {
    const F = this.freq;
    let best = null;
    let second = 0;
    for (let i = 1; i < joined.length; i++) {
      if (i === skipIndex) continue;
      const a = joined.slice(0, i);
      const b = joined.slice(i);
      if (!this.splitPartOk(a) || !this.splitPartOk(b)) continue;
      const c = F.bigram(a, b);
      if (!c) continue;
      if (!best || c > best.count) {
        if (best) second = Math.max(second, best.count);
        best = { a, b, count: c };
      } else second = Math.max(second, c);
    }
    if (!best) return null;
    if (second && best.count < 5 * second) return null; // two plausible splits: don't guess
    best.second = second;
    return best;
  }

  // textBefore / textAfter: the current line split at the cursor. key: the key about to be typed.
  // atLineProtected: caller already decided the context (code, link, ...) is off-limits.
  // Returns { start, end, replacement, original } (char offsets in the line) or null.
  analyze(textBefore, textAfter, key) {
    const S = this.getSettings();
    const full = FULL_TRIGGERS.has(key);
    if (!full && !TABLE_TRIGGERS.has(key)) return null;

    // Slash shorthands (w/o, w/) need their own token pattern.
    const slash = textBefore.match(/(?:^|[\s(\[{"\u201c\u2018*~=>\-])([A-Za-z]+\/[A-Za-z]*)$/);
    if (slash && full && key === " ") {
      const sh = S.shorthandsEnabled && own(S.clinicalShorthands, slash[1].toLowerCase()) && S.clinicalShorthands[slash[1].toLowerCase()];
      if (sh && sh.enabled && sh.mode === "silent" && !this.rejected.has(slash[1].toLowerCase())) {
        const start = textBefore.length - slash[1].length;
        return { start, end: textBefore.length, replacement: matchCase(slash[1], sh.expansion), original: slash[1], ...INFO("shorthand", "SHORTHAND", 1) };
      }
    }

    const tok = textBefore.match(/[\p{L}\p{N}'\u2019]+$/u);
    if (!tok) return null;
    const raw = tok[0];
    const lead = (raw.match(/^['\u2019]+/) || [""])[0].length;
    const trail = (raw.match(/['\u2019]+$/) || [""])[0].length;
    const word = raw.slice(lead, raw.length - trail);
    if (!word) return null;
    const start = textBefore.length - raw.length + lead;
    const end = start + word.length;

    // Typing in the middle of an existing word: leave it alone.
    if (textAfter && /^[\p{L}\p{N}]/u.test(textAfter)) return null;
    // Only words that stand alone (not tags, paths, @handles, snake_case, cell|text ...).
    const prev = start > 0 ? textBefore[start - 1] : "";
    if (prev && !/[\s(\[{"'\u201c\u2018\u2019*~=>\-\u2014\u2013]/.test(prev)) return null;

    const lower = word.toLowerCase().replace(/\u2019/g, "'");
    const rejected = this.rejected.has(lower);
    if (full && !rejected) {
      const boundary = this.fixBoundaries(textBefore, start, end, word, lower);
      if (boundary) return boundary;
    }

    let fixed = null;
    let meta = null;

    // --- Case rule: solitary "i" and i'm / i've / i'll / i'd ---------------------
    if (full && S.capitalizeSolitaryI !== false && word[0] === "i" && /^i(?:'(?:m|ve|ll|d))?$/.test(lower)) {
      fixed = "I" + word.slice(1);
      meta = INFO("case", "CASE", 1);
    }

    // --- Tables -----------------------------------------------------------------
    if (!fixed && !rejected) {
      if (S.shorthandsEnabled && /^[A-Z]?[a-z]+$/.test(word)) {
        const sh = own(S.clinicalShorthands, lower) ? S.clinicalShorthands[lower] : null;
        if (sh && sh.enabled && sh.mode === "silent" && full) {
          fixed = matchCase(word, sh.expansion);
          meta = INFO("shorthand", "SHORTHAND", 1);
        }
      }
      if (!fixed) {
        const cr = own(S.customReplacements, lower) ? S.customReplacements[lower] : null;
        if (typeof cr === "string" && cr && cr !== word) {
          fixed = matchCase(word, cr);
          meta = INFO("replacement", "CUSTOM", 1);
        }
      }
      if (!fixed && this.typoTable.has(lower)) {
        fixed = matchCase(word, this.typoTable.get(lower));
        const fromMedical = this.typoOrigin.get(lower) === "medical";
        meta = INFO("table", fromMedical ? "MEDICAL" : "ENGLISH", 0.99, /^[A-Za-z]+$/.test(word));
      }
    }

    // --- Case rule: TWo INitial CApitals ------------------------------------------
    if (
      !fixed &&
      S.correctTwoInitialCapitals !== false &&
      /^[A-Z]{2}[a-z]+$/.test(word) &&
      !(word.length === 3 && word[2] === "s") // PCs, CTs, IVs ...
    ) {
      fixed = word[0] + word[1].toLowerCase() + word.slice(2);
      meta = INFO("case", "CASE", 1);
    }

    const atSentenceStart = full && this.isSentenceStart(textBefore.slice(0, start));

    // --- Spell-checker path -------------------------------------------------------
    if (!fixed && full && !rejected) {
      const cfg = TIER_CONFIG[S.autocorrectSensitivity || "balanced"];
      if (
        cfg &&
        /^[A-Za-z]+$/.test(word) &&
        (word.length >= cfg.minLen || (word.length === 3 && this.freqReady())) &&
        !(word === word.toUpperCase() && word.length > 1) && // acronyms
        !/[A-Z]/.test(word.slice(1)) && // camelCase / eGFR
        !(/^[A-Z]/.test(word) && !atSentenceStart) && // probable proper noun
        !this.isKnown(lower) &&
        this.spellState(word) !== true
      ) {
        const s = this.suggest(word, lower, cfg, { transpositionOnly: word.length < cfg.minLen });
        if (s) {
          fixed = matchCase(word, s.word);
          meta = INFO("spelling", s.source === "dict" ? "MEDICAL" : "ENGLISH", Math.min(0.99, s.score), true);
        }
      }
    }

    // --- Sentence capitalisation (layered on top of any fix above) ----------------
    let result = fixed !== null ? fixed : word;
    if (
      atSentenceStart &&
      S.capitalizeFirstLetterSentences !== false &&
      /^[a-z]/.test(result) &&
      !/[A-Z0-9_\/\\.@:]/.test(result)
    ) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    if (result === word) return null;
    return { start, end, replacement: result, original: word, ...(fixed !== null && meta ? meta : INFO("case", "CASE", 1)) };
  }
}

// ---------------------------------------------------------------------------
// Side panel listing every silent auto-correction (newest first).
// ---------------------------------------------------------------------------
function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

class CorrectionLogView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_CORRECTIONS;
  }
  getDisplayText() {
    return "Auto-corrections";
  }
  getIcon() {
    return "spell-check";
  }

  async onOpen() {
    this.contentEl.addClass("mac-panel");
    this.render();
    this.registerInterval(window.setInterval(() => this.render(), 30000)); // keep "5m ago" fresh
  }

  async onClose() {}

  render(isNew = false) {
    const root = this.contentEl;
    const scroll = root.scrollTop;
    root.empty();
    const log = this.plugin.settings.correctionLog || [];

    // Header
    const header = root.createDiv({ cls: "mac-header" });
    const title = header.createDiv({ cls: "mac-title" });
    title.createSpan({ text: "Auto-corrections" });
    title.createSpan({ cls: "mac-count", text: String(log.length) });
    const clear = header.createEl("button", { cls: "mac-clear", attr: { "aria-label": "Clear list" } });
    setIcon(clear, "trash-2");
    clear.addEventListener("click", () => this.plugin.clearCorrectionLog());
    if (!log.length) clear.addClass("is-hidden");

    if (!log.length) {
      const empty = root.createDiv({ cls: "mac-empty" });
      setIcon(empty.createDiv({ cls: "mac-empty-icon" }), "spell-check");
      empty.createDiv({ cls: "mac-empty-title", text: "No auto-corrections yet" });
      empty.createDiv({ cls: "mac-empty-text", text: "Silent fixes appear here as you type. Press Backspace right after a fix to undo it." });
      return;
    }

    const avg = Math.round((log.reduce((n, e) => n + (e.confidence || 0), 0) / log.length) * 100);
    root.createDiv({ cls: "mac-sub", text: `Silent fixes while you type \u00b7 avg ${avg}% confidence` });

    const list = root.createDiv({ cls: "mac-list" });
    log.forEach((e, i) => {
      const card = list.createDiv({
        cls: "mac-card" + (isNew && i === 0 ? " mac-fresh" : "") + (e.reverted ? " is-reverted" : ""),
      });

      // Word change + type badge
      const top = card.createDiv({ cls: "mac-top" });
      const words = top.createDiv({ cls: "mac-words" });
      words.createSpan({ cls: "mac-orig", text: e.original });
      setIcon(words.createSpan({ cls: "mac-arrow" }), "arrow-right");
      words.createSpan({ cls: "mac-fixed", text: e.corrected });
      top.createSpan({ cls: "mac-badge mac-badge-" + String(e.label || "fix").toLowerCase(), text: e.label || "FIX" });

      // One compact line: confidence meter + %, when/where, and the small dictionary button
      const pct = Math.round((e.confidence || 0) * 100);
      const tier = pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";
      const row = card.createDiv({ cls: "mac-row" });
      const conf = row.createDiv({ cls: "mac-conf", attr: { title: pct + "% confidence" } });
      conf.createEl("progress", { cls: "mac-meter mac-" + tier, attr: { max: "100", value: String(pct) } });
      conf.createSpan({ cls: "mac-pct", text: pct + "%" });
      const when = [timeAgo(e.time), e.note, e.reverted ? "reverted" : ""].filter(Boolean).join(" \u00b7 ");
      const meta = row.createSpan({ cls: "mac-meta", text: when });
      meta.setAttr("title", when + " \u2014 " + new Date(e.time).toLocaleString());

      if (e.canAdd) {
        const inDict = this.plugin.isInCustomDict(e.original);
        const btn = row.createEl("button", {
          cls: "mac-dict" + (inDict ? " is-added" : ""),
          attr: { "aria-label": inDict ? `"${e.original}" is in your dictionary` : `Add "${e.original}" to your dictionary so it is never corrected` },
        });
        setIcon(btn.createSpan({ cls: "mac-dict-icon" }), inDict ? "check" : "plus");
        btn.createSpan({ text: inDict ? "Added" : "Dict" });
        if (inDict) btn.disabled = true;
        else
          btn.addEventListener("click", async () => {
            await this.plugin.addWordToSubDict("custom", e.original);
            this.render();
          });
      }
    });

    root.scrollTop = scroll;
  }
}

class SilentAutocorrectPlugin extends Plugin {
  async onload() {
    this.engine = new AutoCorrectEngine(() => this.settings, () => this.getSpellOracle());
    await this.loadSettings();
    // Optional frequency data: load in the background, then (once) offer to download it if missing.
    this.loadFrequencyData().then(() => {
      this.app.workspace.onLayoutReady(() => this.maybePromptFrequencyDownload());
    });
    this.registerView(VIEW_TYPE_CORRECTIONS, (leaf) => new CorrectionLogView(leaf, this));

    this.lastCorrection = null;
    this.sessionCorrectionCount = 0;
    this.currentWordCount = 0;
    this.currentCharCount = 0;

    // 1. Build interactive Bottom Status Bar
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("plugin-silent-autocorrect-bar");
    this.renderStatusBar();

    // Update counts when active note changes or text changes
    this.registerEvent(
      this.app.workspace.on("editor-change", (editor) => {
        this.updateCounts(editor);
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.containerEl) this.attachKeydown(view.containerEl.ownerDocument);
        if (view && view.editor) {
          this.updateCounts(view.editor);
        }
      })
    );

    // Initial word count fetch
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView && activeView.editor) {
      this.updateCounts(activeView.editor);
    }

    // 2. Add Left Ribbon Icon
    this.addRibbonIcon("book-plus", "Add word to dictionary", () => {
      new QuickAddWordModal(this.app, this).open();
    });

    this.addRibbonIcon("spell-check", "Show auto-corrections", () => this.activateCorrectionsView());

    // 3. Register Commands in Command Palette
    this.addCommand({
      id: "open-corrections-panel",
      name: "Show auto-corrections panel",
      callback: () => this.activateCorrectionsView(),
    });
    this.addCommand({
      id: "quick-add-word-to-dictionary",
      name: "Add new word to dictionary",
      callback: () => new QuickAddWordModal(this.app, this).open(),
    });

    this.addCommand({
      id: "add-selection-to-dictionary",
      name: "Add word under cursor to dictionary",
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        const wordRange = editor.wordAt(cursor);
        const word = wordRange ? editor.getRange(wordRange.from, wordRange.to) : "";
        new QuickAddWordModal(this.app, this, word).open();
      },
    });

    this.addCommand({
      id: "open-dictionary-manager",
      name: "Open dictionary and wordlists manager",
      callback: () => new DictionaryManagerModal(this.app, this).open(),
    });

    this.addCommand({
      id: "download-frequency-dictionaries",
      name: "Download frequency dictionaries",
      callback: () => this.downloadFrequencyData(),
    });

    this.addCommand({
      id: "toggle-autocorrect",
      name: "Toggle auto-correct on or off",
      callback: async () => {
        this.settings.autoCorrectEnabled = !this.settings.autoCorrectEnabled;
        await this.saveSettings();
        this.renderStatusBar();
        new Notice("Auto-Correct: " + (this.settings.autoCorrectEnabled ? "ON" : "OFF"));
      },
    });

    this.addCommand({
      id: "cycle-sensitivity",
      name: "Cycle auto-correct sensitivity",
      callback: async () => {
        const tiers = SENSITIVITY_TIERS;
        const curIdx = tiers.indexOf(this.settings.autocorrectSensitivity);
        const nextTier = tiers[(curIdx + 1) % tiers.length];
        this.settings.autocorrectSensitivity = nextTier;
        await this.saveSettings();
        this.renderStatusBar();
        new Notice("Sensitivity set to: " + nextTier.toUpperCase());
      },
    });

    this.addCommand({
      id: "revert-last-autocorrection",
      name: "Revert last auto-correction",
      editorCallback: (editor) => {
        this.revertLastCorrection(editor);
      },
    });

    // 4. Register Editor Keydown Listener for Auto-Correct.
    // Capture phase on purpose: we must run BEFORE the editor's own Enter / list handling,
    // otherwise the cursor has already moved to the next line when we look for the word.
    // Registered once per document, and re-checked at several points (layout ready, every
    // leaf change, new popout windows) so a missed registration at startup heals itself.
    this.keydownDocs = new WeakSet();
    this.attachKeydown(this.app.workspace.containerEl && this.app.workspace.containerEl.ownerDocument);
    this.attachKeydown(activeDocument);
    this.app.workspace.onLayoutReady(() => {
      this.attachKeydown(this.app.workspace.containerEl && this.app.workspace.containerEl.ownerDocument);
      this.attachKeydown(activeDocument);
    });
    this.registerEvent(this.app.workspace.on("window-open", (_win, popout) => this.attachKeydown(popout.document)));

    // 5. Register Context Menu Items on Right Click
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const cursor = editor.getCursor();
        const wordRange = editor.wordAt(cursor);
        if (!wordRange) return;
        const word = editor.getRange(wordRange.from, wordRange.to);

        menu.addItem((item) => {
          item
            .setTitle(`➕ Add "${word}" to Dictionary`)
            .setIcon("book-plus")
            .onClick(() => {
              new QuickAddWordModal(this.app, this, word).open();
            });
        });

        // Quick add directly to sub-specialties
        menu.addItem((item) => {
          item
            .setTitle(`Add "${word}" to Cardiology`)
            .setIcon("heart")
            .onClick(async () => {
              await this.addWordToSubDict("cardiology", word);
            });
        });

        menu.addItem((item) => {
          item
            .setTitle(`Add "${word}" to Pharmacology`)
            .setIcon("pill")
            .onClick(async () => {
              await this.addWordToSubDict("pharmacology", word);
            });
        });

        if (this.lastCorrection && this.lastCorrection.corrected === word) {
          menu.addItem((item) => {
            item
              .setTitle(`↺ Revert to "${this.lastCorrection.original}"`)
              .setIcon("undo")
              .onClick(() => this.revertLastCorrection(editor, true));
          });
        }
      })
    );

    // 6. Register Obsidian Settings Tab
    this.settingTab = new SilentAutocorrectSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
  }

  updateCounts(editor) {
    if (!editor) return;
    try {
      const text = editor.getValue() || "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      this.currentWordCount = words;
      this.currentCharCount = text.length;
      this.renderStatusBar();
    } catch (e) {}
  }

  // Undo the last silent correction. Returns true if something was reverted.
  revertLastCorrection(editor, quiet = false) {
    const lc = this.lastCorrection;
    if (!lc || !editor) {
      if (!quiet) new Notice("No recent auto-correction to revert");
      return false;
    }
    const from = { line: lc.line, ch: lc.startCh };
    const to = { line: lc.line, ch: lc.endCh };
    if (editor.getRange(from, to) !== lc.corrected) {
      this.lastCorrection = null; // text has moved on; nothing safe to revert
      if (!quiet) new Notice("No recent auto-correction to revert");
      return false;
    }
    const delta = lc.original.length - lc.corrected.length;
    const cur = editor.getCursor();
    editor.replaceRange(lc.original, from, to);
    if (cur.line === lc.line && cur.ch >= lc.endCh) editor.setCursor({ line: cur.line, ch: cur.ch + delta });
    // Like Word's "stop automatically correcting": don't redo it this session.
    this.engine.rejected.add(lc.original.toLowerCase().replace(/\u2019/g, "'"));
    if (lc.logId) this.markReverted(lc.logId);
    this.lastCorrection = null;
    if (!quiet) new Notice("Reverted to: " + lc.original);
    return true;
  }

  renderStatusBar() {
    if (!this.statusBarItem) return;
    this.statusBarItem.empty();

    const enabled = this.settings.autoCorrectEnabled;
    const subCount = Object.values(this.settings.subDictionaries || {}).filter((s) => s.enabled).length;
    const sens = (this.settings.autocorrectSensitivity || "balanced").toUpperCase();
    const fixCount = this.sessionCorrectionCount || 0;

    // 1. Metrics Pill
    const metricsEl = this.statusBarItem.createSpan({ cls: "status-bar-metrics" });
    const estRead = Math.max(1, Math.ceil(this.currentWordCount / 200));
    metricsEl.setText(`${this.currentWordCount}w · ${this.currentCharCount}c (~ ${estRead}m)`);
    metricsEl.title = "Document word & character counts";

    // 2. Add Word Button Pill
    const addBtn = this.statusBarItem.createSpan({ cls: "status-bar-pill status-bar-add-btn" });
    addBtn.setText("➕ Add Word");
    addBtn.title = "Click to add a new medical term or custom word to dictionaries";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      new QuickAddWordModal(this.app, this).open();
    });

    // 3. Auto-Correct Toggle Pill
    const autoCorrectPill = this.statusBarItem.createSpan({ cls: "status-bar-pill" });
    const dot = autoCorrectPill.createSpan({ cls: "status-dot " + (enabled ? "active" : "inactive") });
    autoCorrectPill.createSpan({ text: "Auto-Correct: " + (enabled ? "ON" : "OFF") });
    autoCorrectPill.title = "Click to toggle real-time auto-correct ON / OFF";
    autoCorrectPill.addEventListener("click", async (e) => {
      e.stopPropagation();
      this.settings.autoCorrectEnabled = !this.settings.autoCorrectEnabled;
      await this.saveSettings();
      this.renderStatusBar();
      new Notice("Auto-Correct is now " + (this.settings.autoCorrectEnabled ? "ON" : "OFF"));
    });

    // 4. Sensitivity Pill
    const sensPill = this.statusBarItem.createSpan({ cls: "status-bar-pill pill-sens" });
    sensPill.setText("⚡ " + sens);
    sensPill.title = "Click to cycle sensitivity: Ultra → Proactive → Balanced → Strict → Minimal";
    sensPill.addEventListener("click", async (e) => {
      e.stopPropagation();
      const tiers = SENSITIVITY_TIERS;
      const curIdx = tiers.indexOf(this.settings.autocorrectSensitivity);
      const nextTier = tiers[(curIdx + 1) % tiers.length];
      this.settings.autocorrectSensitivity = nextTier;
      await this.saveSettings();
      this.renderStatusBar();
      new Notice("Sensitivity changed to: " + nextTier.toUpperCase());
    });

    // 5. Sub-Dictionaries Pill
    const dictPill = this.statusBarItem.createSpan({ cls: "status-bar-pill pill-dict" });
    dictPill.setText("📚 " + subCount + " Sub-Dicts");
    dictPill.title = "Click to open Dictionary & Wordlists Manager";
    dictPill.addEventListener("click", (e) => {
      e.stopPropagation();
      new DictionaryManagerModal(this.app, this).open();
    });

    // 6. Fixes Counter Pill (if > 0)
    if (fixCount > 0) {
      const fixedPill = this.statusBarItem.createSpan({ cls: "status-bar-pill pill-fixed" });
      fixedPill.setText("↺ " + fixCount + " fixed");
      fixedPill.title = "Click to revert last auto-correction";
      fixedPill.addEventListener("click", (e) => {
        e.stopPropagation();
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView && mdView.editor) {
          this.revertLastCorrection(mdView.editor);
        } else {
          new Notice("Open a note to revert last correction");
        }
      });
    }

    // Right-click or general click on bar background opens Quick Menu
    this.statusBarItem.addEventListener("contextmenu", (evt) => {
      evt.preventDefault();
      this.showQuickMenu(evt);
    });
  }

  showQuickMenu(evt) {
    const menu = new Menu();

    menu.addItem((item) =>
      item
        .setTitle("View auto-corrections")
        .setIcon("spell-check")
        .onClick(() => this.activateCorrectionsView())
    );

    menu.addItem((item) =>
      item
        .setTitle("➕ Add Word to Dictionary")
        .setIcon("book-plus")
        .onClick(() => new QuickAddWordModal(this.app, this).open())
    );

    menu.addItem((item) =>
      item
        .setTitle("Auto-Correct: " + (this.settings.autoCorrectEnabled ? "ON (Active)" : "OFF (Disabled)"))
        .setIcon("zap")
        .onClick(async () => {
          this.settings.autoCorrectEnabled = !this.settings.autoCorrectEnabled;
          await this.saveSettings();
          this.renderStatusBar();
          new Notice("Auto-Correct: " + (this.settings.autoCorrectEnabled ? "ON" : "OFF"));
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("Sensitivity: " + (this.settings.autocorrectSensitivity || "balanced").toUpperCase())
        .setIcon("sliders")
        .onClick(async () => {
          const tiers = SENSITIVITY_TIERS;
          const curIdx = tiers.indexOf(this.settings.autocorrectSensitivity);
          const nextTier = tiers[(curIdx + 1) % tiers.length];
          this.settings.autocorrectSensitivity = nextTier;
          await this.saveSettings();
          this.renderStatusBar();
          new Notice("Sensitivity switched to: " + nextTier.toUpperCase());
        })
    );

    menu.addItem((item) =>
      item
        .setTitle("📚 Dictionary Wordlists Manager")
        .setIcon("book-open")
        .onClick(() => new DictionaryManagerModal(this.app, this).open())
    );

    menu.addItem((item) =>
      item
        .setTitle("↺ Revert Last Auto-Correction")
        .setIcon("undo")
        .onClick(() => {
          const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (mdView && mdView.editor) this.revertLastCorrection(mdView.editor);
        })
    );

    menu.showAtMouseEvent(evt);
  }

  async addWordToSubDict(subId, word) {
    const clean = word.trim().toLowerCase();
    if (!clean) return;

    if (subId === "custom") {
      if (!this.settings.customWords.includes(clean)) {
        this.settings.customWords.push(clean);
      }
    } else {
      if (!this.settings.customSubWords[subId]) {
        this.settings.customSubWords[subId] = [];
      }
      if (!this.settings.customSubWords[subId].includes(clean)) {
        this.settings.customSubWords[subId].push(clean);
      }
    }

    await this.saveSettings();
    this.renderStatusBar();
    new Notice(`Added "${clean}" to ${subId} dictionary!`);
  }

  // Obsidian desktop ships Chromium's spell-checker (the one behind Settings > Editor >
  // Spellcheck). It is our "is this really a misspelling?" oracle and suggestion source,
  // which is what stops us rewriting perfectly good words we simply don't list.
  // Returns null on mobile or when spellcheck is switched off.
  getSpellOracle() {
    try {
      if (!Platform.isDesktopApp) return null;
      const electron = require("electron");
      const wf = electron && (electron.webFrame || (electron.remote && electron.remote.webFrame));
      if (!wf || typeof wf.isWordMisspelled !== "function") return null;
      if (!wf.isWordMisspelled("qzxwvkjhq")) return null; // spellcheck disabled => everything looks "valid"
      return {
        isMisspelled: (w) => wf.isWordMisspelled(w),
        suggest: (w) => (typeof wf.getWordSuggestions === "function" ? wf.getWordSuggestions(w) : [])
      };
    } catch (e) {
      return null;
    }
  }

  isRealWord(word) {
    return this.engine.isKnown(String(word).toLowerCase());
  }

  attachKeydown(doc) {
    if (!doc || !this.keydownDocs || this.keydownDocs.has(doc)) return;
    this.keydownDocs.add(doc);
    this.registerDomEvent(doc, "keydown", (evt) => this.onKeyDown(evt), true);
  }

  onKeyDown(evt) {
    if (!this.settings.autoCorrectEnabled) return;
    if (evt.isComposing || evt.keyCode === 229 || evt.repeat) return;
    if (evt.ctrlKey || evt.metaKey || evt.altKey) return;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.editor) return;
    const editor = view.editor;

    // Only react to typing in THIS note's main editor, never in modals, settings fields,
    // the search box, or the nested editors Live Preview uses for table cells.
    const target = evt.target;
    if (!target || typeof target.closest !== "function") return;
    const content = target.closest(".cm-content");
    if (!content || !view.containerEl.contains(content)) return;
    if (editor.cm && editor.cm.contentDOM && content !== editor.cm.contentDOM) return;
    if (target.closest(".cm-embed-block, .cm-table-widget, .table-cell-wrapper")) return;

    // Backspace right after a correction restores what was typed.
    if (evt.key === "Backspace") {
      if (this.settings.undoOnBackspace && this.undoArmed && this.lastCorrection && !editor.somethingSelected()) {
        const lc = this.lastCorrection;
        const cur = editor.getCursor();
        const sameLineAfterDelim = cur.line === lc.line && cur.ch === lc.endCh + (lc.delim === "\n" ? 0 : lc.delim.length);
        const nextLineAfterEnter = lc.delim === "\n" && cur.line === lc.line + 1;
        if (Date.now() - lc.time < 5000 && (sameLineAfterDelim || nextLineAfterEnter)) {
          if (this.revertLastCorrection(editor, true)) {
            evt.preventDefault();
            evt.stopPropagation();
          }
        }
      }
      this.undoArmed = false; // an ordinary Backspace: the correction can no longer be undone this way
      return;
    }

    // Any other key (except bare modifiers) ends the "undo with Backspace" window.
    if (!["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(evt.key)) this.undoArmed = false;
    this.checkWordUnderCursor(editor, evt.key);
  }

  // True when the cursor is somewhere autocorrect must never touch.
  isProtectedContext(editor, cursor, before) {
    const lineText = editor.getLine(cursor.line);

    // Inline code, math, wikilinks, link targets, HTML tags, %% comments.
    if (((before.match(/(?<!\\)`/g) || []).length) % 2 === 1) return true;
    if (((before.replace(/\\\$/g, "").match(/\$/g) || []).length) % 2 === 1) return true;
    if (before.lastIndexOf("[[") > before.lastIndexOf("]]")) return true;
    if (before.lastIndexOf("](") > before.lastIndexOf(")")) return true;
    if (/<[A-Za-z\/!][^>]*$/.test(before)) return true;
    if (((before.match(/%%/g) || []).length) % 2 === 1) return true;
    if (/^\s*(```|~~~)/.test(lineText)) return true;

    // Block-level state: frontmatter, fenced code, $$ math blocks.
    if (cursor.line > 0 || /^---\s*$/.test(lineText)) {
      const upTo = cursor.line > 0 ? editor.getRange({ line: 0, ch: 0 }, { line: cursor.line, ch: 0 }) : "";
      const lines = upTo.split("\n");
      lines.pop(); // trailing "" from the range ending at column 0
      let i = 0;
      if (lines.length && /^---\s*$/.test(lines[0])) {
        let closed = -1;
        for (let j = 1; j < lines.length; j++) {
          if (/^(---|\.\.\.)\s*$/.test(lines[j])) { closed = j; break; }
        }
        if (closed === -1) return true; // still inside the YAML block
        i = closed + 1;
      }
      let fence = null; // { ch, len }
      let inMath = false;
      for (; i < lines.length; i++) {
        const ln = lines[i];
        const f = ln.match(/^\s*(`{3,}|~{3,})/);
        if (fence) {
          if (f && f[1][0] === fence.ch && f[1].length >= fence.len && /^\s*(`{3,}|~{3,})\s*$/.test(ln)) fence = null;
          continue;
        }
        if (f) { fence = { ch: f[1][0], len: f[1].length }; continue; }
        if (((ln.match(/\$\$/g) || []).length) % 2 === 1) inMath = !inMath;
      }
      if (fence || inMath) return true;
    }
    return false;
  }

  checkWordUnderCursor(editor, key) {
    if (editor.somethingSelected()) return;
    const cursor = editor.getCursor();
    const lineText = editor.getLine(cursor.line);
    const before = lineText.slice(0, cursor.ch);
    const after = lineText.slice(cursor.ch);

    if (!before || this.isProtectedContext(editor, cursor, before)) return;

    const res = this.engine.analyze(before, after, key);
    if (!res) return;

    const line = cursor.line;
    editor.replaceRange(res.replacement, { line, ch: res.start }, { line, ch: res.end });
    editor.setCursor({ line, ch: cursor.ch + (res.replacement.length - (res.end - res.start)) });

    this.sessionCorrectionCount = (this.sessionCorrectionCount || 0) + 1;
    this.lastCorrection = {
      original: res.original,
      corrected: res.replacement,
      line,
      startCh: res.start,
      endCh: res.start + res.replacement.length,
      delim: key === "Enter" ? "\n" : key,
      time: Date.now()
    };
    this.lastCorrection.logId = this.logCorrection(res);
    this.undoArmed = true;
    this.renderStatusBar();
  }

  // ---- Auto-correction log (feeds the side panel) --------------------------------------
  isInCustomDict(word) {
    const w = String(word).trim().toLowerCase();
    if ((this.settings.customWords || []).some((x) => String(x).toLowerCase() === w)) return true;
    return Object.values(this.settings.customSubWords || {}).some((l) => (l || []).some((x) => String(x).toLowerCase() === w));
  }

  logCorrection(res) {
    try {
      if (!Array.isArray(this.settings.correctionLog)) this.settings.correctionLog = [];
      let note = "";
      try {
        const f = this.app.workspace.getActiveFile && this.app.workspace.getActiveFile();
        if (f) note = f.basename;
      } catch (e) {}
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      this.settings.correctionLog.unshift({
        id,
        original: res.original,
        corrected: res.replacement,
        confidence: typeof res.confidence === "number" ? res.confidence : 1,
        kind: res.kind || "case",
        label: res.label || "FIX",
        canAdd: !!res.canAdd,
        note,
        time: Date.now(),
      });
      if (this.settings.correctionLog.length > LOG_LIMIT) this.settings.correctionLog.length = LOG_LIMIT;
      this.refreshCorrectionViews(true);
      this.scheduleLogSave();
      return id;
    } catch (e) {
      console.error("Silent Autocorrect: could not log correction", e);
      return null;
    }
  }

  markReverted(id) {
    const entry = (this.settings.correctionLog || []).find((x) => x.id === id);
    if (!entry) return;
    entry.reverted = true;
    this.refreshCorrectionViews();
    this.scheduleLogSave();
  }

  clearCorrectionLog() {
    this.settings.correctionLog = [];
    this.refreshCorrectionViews();
    this.scheduleLogSave();
  }

  // Corrections are written to disk a moment after the last one, not on every keystroke.
  scheduleLogSave() {
    if (this.logSaveTimer) clearTimeout(this.logSaveTimer);
    this.logSaveTimer = setTimeout(() => {
      this.logSaveTimer = null;
      if (typeof this.saveData === "function") Promise.resolve(this.saveData(this.settings)).catch(() => {});
    }, 2000);
  }

  onunload() {
    if (this.logSaveTimer) {
      clearTimeout(this.logSaveTimer);
      this.logSaveTimer = null;
      if (typeof this.saveData === "function") this.saveData(this.settings);
    }
  }

  refreshCorrectionViews(isNew = false) {
    try {
      if (!this.app.workspace.getLeavesOfType) return;
      for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_CORRECTIONS)) {
        if (leaf.view && typeof leaf.view.render === "function") leaf.view.render(isNew);
      }
    } catch (e) {}
  }

  async activateCorrectionsView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CORRECTIONS)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_TYPE_CORRECTIONS, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  getPluginDir() {
    return normalizePath((this.manifest && this.manifest.dir) || `${this.app.vault.configDir}/plugins/${this.manifest.id}`);
  }

  // Asks once (ever) whether to download the optional dictionaries. Nothing is fetched without a click.
  maybePromptFrequencyDownload() {
    const missing = this.freqStatus && this.freqStatus.state === "missing";
    if (!missing || this.settings.freqDownloadPrompted || this.settings.useFrequencyDictionary === false) return;
    new FrequencyDownloadModal(this.app, this).open();
  }

  // Downloads both SymSpell files with requestUrl (works on desktop and mobile, no CORS issues).
  async downloadFrequencyData() {
    if (this.freqDownloading) return false;
    this.freqDownloading = true;
    const notice = new Notice("Downloading dictionaries...", 0);
    try {
      const adapter = this.app.vault.adapter;
      const dir = this.getPluginDir();
      for (let i = 0; i < FREQ_FILES.length; i++) {
        const file = FREQ_FILES[i];
        notice.setMessage(`Downloading dictionary ${i + 1} of ${FREQ_FILES.length}...`);
        const res = await requestUrl({ url: FREQ_DOWNLOAD_BASE + file.name, method: "GET" });
        if (res.status !== 200) throw new Error(`HTTP ${res.status} for ${file.name}`);
        if (!looksLikeFrequencyFile(res.text, file.minParts)) throw new Error(`${file.name} did not look like a dictionary file`);
        await adapter.write(normalizePath(`${dir}/${file.name}`), res.text);
      }
      notice.hide();
      new Notice("Dictionaries downloaded. Loading...");
      await this.loadFrequencyData();
      this.refreshSettingTab();
      return true;
    } catch (e) {
      notice.hide();
      console.error("Silent Autocorrect: dictionary download failed", e);
      new Notice("Could not download the dictionaries. Check your connection and try again.");
      return false;
    } finally {
      this.freqDownloading = false;
    }
  }

  refreshSettingTab() {
    try {
      const tab = this.settingTab;
      if (tab && tab.containerEl && tab.containerEl.isConnected) tab.display();
    } catch (e) {
      /* settings tab not open */
    }
  }

  // Loads the optional SymSpell frequency files from the plugin folder. Never blocks startup.
  async loadFrequencyData() {
    const status = { state: "loading", words: 0, bigrams: 0, detail: "" };
    this.freqStatus = status;
    try {
      const adapter = this.app.vault.adapter;
      const dir = this.getPluginDir();
      const uniPath = `${dir}/${FREQ_UNIGRAM_FILE}`;
      if (!(await adapter.exists(uniPath))) {
        status.state = "missing";
        status.detail = "Dictionaries not downloaded yet";
        return;
      }
      const model = new FrequencyModel(this.settings.freqCandidateTopN || 50000);
      await model.loadUnigrams(await adapter.read(uniPath));
      if (!model.ready) {
        status.state = "error";
        status.detail = `${FREQ_UNIGRAM_FILE} had no usable "word count" lines`;
        return;
      }
      this.engine.setFrequency(model); // usable from here on, bigrams follow
      status.words = model.uni.size;
      const biPath = `${dir}/${FREQ_BIGRAM_FILE}`;
      if (await adapter.exists(biPath)) {
        await model.loadBigrams(await adapter.read(biPath));
        status.bigrams = model.bi.size;
      } else {
        status.detail = `${FREQ_BIGRAM_FILE} not found: split/merge fixes are off`;
      }
      status.state = "loaded";
    } catch (e) {
      console.error("Silent Autocorrect: could not load frequency data", e);
      status.state = "error";
      status.detail = String((e && e.message) || e);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.customSubWords) {
      this.settings.customSubWords = {
        cardiology: [],
        pharmacology: [],
        surgery: [],
        neurology: [],
        pathology: [],
        anatomy: []
      };
    }
    this.engine.rebuild();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.engine.rebuild();
    this.renderStatusBar();
  }
}

// Modal 1: Quick Add Word Modal
class QuickAddWordModal extends Modal {
  constructor(app, plugin, defaultWord = "") {
    super(app);
    this.plugin = plugin;
    this.defaultWord = defaultWord;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Add word to dictionary" });
    contentEl.createEl("p", {
      text: "Instantly add medical terms, pharmaceutical names, or custom jargon to prevent unwanted corrections.",
      cls: "setting-item-description"
    });

    let word = this.defaultWord;
    let targetDict = "cardiology";

    new Setting(contentEl)
      .setName("Word or term")
      .setDesc("Enter word to be recognized across your vault.")
      .addText((text) => {
        text.setValue(word).onChange((val) => (word = val));
        text.inputEl.focus();
      });

    new Setting(contentEl)
      .setName("Target Sub-Dictionary")
      .setDesc("Choose which medical specialty or user dictionary will store this term.")
      .addDropdown((drop) => {
        drop.addOption("cardiology", "Cardiology & Pulmonology");
        drop.addOption("pharmacology", "Pharmacology & Medications");
        drop.addOption("surgery", "Surgery & Procedures");
        drop.addOption("neurology", "Neurology & Psychiatry");
        drop.addOption("pathology", "Pathology & Oncology");
        drop.addOption("anatomy", "Anatomy & Physiology");
        drop.addOption("custom", "Custom User Words");
        drop.setValue(targetDict);
        drop.onChange((val) => (targetDict = val));
      });

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Add Word to Dictionary")
        .setCta()
        .onClick(async () => {
          const clean = word.trim().toLowerCase();
          if (!clean) return;

          await this.plugin.addWordToSubDict(targetDict, clean);
          this.close();
        });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// Modal 2: Dictionary Wordlists & Sub-Dictionaries Manager Modal
class DictionaryManagerModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.renderModal();
  }

  renderModal() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Dictionary and wordlists manager" });

    // 1. Quick Add Word Section
    new Setting(contentEl).setName("Add new term").setHeading();
    let newWordInput = "";
    let targetSub = "cardiology";

    new Setting(contentEl)
      .setName("New word")
      .setDesc("Add term directly to any active sub-dictionary.")
      .addText((txt) => txt.setPlaceholder("e.g. cardioverter").onChange((v) => (newWordInput = v)))
      .addDropdown((drop) => {
        drop.addOption("cardiology", "Cardiology");
        drop.addOption("pharmacology", "Pharmacology");
        drop.addOption("surgery", "Surgery");
        drop.addOption("neurology", "Neurology");
        drop.addOption("pathology", "Pathology");
        drop.addOption("anatomy", "Anatomy");
        drop.addOption("custom", "Custom User Words");
        drop.setValue(targetSub);
        drop.onChange((v) => (targetSub = v));
      })
      .addButton((btn) =>
        btn
          .setButtonText("Add Word")
          .setCta()
          .onClick(async () => {
            const clean = newWordInput.trim().toLowerCase();
            if (!clean) return;
            await this.plugin.addWordToSubDict(targetSub, clean);
            this.renderModal();
          })
      );

    // 2. Bulk Import Section
    new Setting(contentEl).setName("Bulk import words").setHeading();
    let bulkWordsText = "";
    let bulkTarget = "cardiology";

    new Setting(contentEl)
      .setName("Target dictionary")
      .addDropdown((drop) => {
        drop.addOption("cardiology", "Cardiology");
        drop.addOption("pharmacology", "Pharmacology");
        drop.addOption("surgery", "Surgery");
        drop.addOption("neurology", "Neurology");
        drop.addOption("pathology", "Pathology");
        drop.addOption("anatomy", "Anatomy");
        drop.addOption("custom", "Custom User Words");
        drop.setValue(bulkTarget);
        drop.onChange((v) => (bulkTarget = v));
      });

    const bulkTextarea = contentEl.createEl("textarea", {
      cls: "setting-item-description sac-bulk-textarea",
      attr: {
        placeholder: "Paste multiple words separated by commas, spaces, or newlines...",
        rows: "3"
      }
    });
    bulkTextarea.addEventListener("input", (e) => (bulkWordsText = e.target.value));

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Import All Words")
        .onClick(async () => {
          const words = bulkWordsText
            .split(/[\n,\s]+/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length > 1);

          if (words.length === 0) return;

          for (const w of words) {
            if (bulkTarget === "custom") {
              if (!this.plugin.settings.customWords.includes(w)) {
                this.plugin.settings.customWords.push(w);
              }
            } else {
              if (!this.plugin.settings.customSubWords[bulkTarget]) {
                this.plugin.settings.customSubWords[bulkTarget] = [];
              }
              if (!this.plugin.settings.customSubWords[bulkTarget].includes(w)) {
                this.plugin.settings.customSubWords[bulkTarget].push(w);
              }
            }
          }

          await this.plugin.saveSettings();
          new Notice(`Imported ${words.length} words into ${bulkTarget}!`);
          this.renderModal();
        })
    );

    // 3. Sub-Dictionaries List
    new Setting(contentEl).setName("Medical sub-dictionaries").setHeading();

    for (const [id, sub] of Object.entries(this.plugin.settings.subDictionaries || {})) {
      const customCount = (this.plugin.settings.customSubWords?.[id] || []).length;
      new Setting(contentEl)
        .setName(sub.name)
        .setDesc(`${sub.description} (${sub.wordCount + customCount} words total; ${customCount} custom added)`)
        .addToggle((toggle) =>
          toggle.setValue(sub.enabled).onChange(async (val) => {
            this.plugin.settings.subDictionaries[id].enabled = val;
            await this.plugin.saveSettings();
          })
        )
        .addDropdown((drop) =>
          drop
            .addOption("silent", "⚡ Silent")
            .addOption("underline", "〰️ Underline")
            .setValue(sub.mode)
            .onChange(async (val) => {
              this.plugin.settings.subDictionaries[id].mode = val;
              await this.plugin.saveSettings();
            })
        );
    }

    // 4. Custom Added Words List
    new Setting(contentEl).setName("Custom added words").setHeading();
    const wordsDiv = contentEl.createDiv({ cls: "custom-words-container" });

    const allCustomItems = [];
    (this.plugin.settings.customWords || []).forEach((w) => allCustomItems.push({ word: w, dict: "custom" }));
    if (this.plugin.settings.customSubWords) {
      for (const [dictId, list] of Object.entries(this.plugin.settings.customSubWords)) {
        (list || []).forEach((w) => allCustomItems.push({ word: w, dict: dictId }));
      }
    }

    if (allCustomItems.length === 0) {
      wordsDiv.createEl("p", { text: "No custom words added yet. Add one above!", cls: "setting-item-description" });
    } else {
      allCustomItems.forEach(({ word, dict }) => {
        const badge = wordsDiv.createSpan({ cls: "spellcheck-dict-badge" });
        badge.createSpan({ text: word });
        badge.createSpan({ cls: "spellcheck-dict-tag", text: dict });
        const removeBtn = badge.createSpan({ cls: "remove-btn", text: "✕" });
        removeBtn.title = "Delete word";
        removeBtn.addEventListener("click", async () => {
          if (dict === "custom") {
            this.plugin.settings.customWords = this.plugin.settings.customWords.filter((x) => x !== word);
          } else if (this.plugin.settings.customSubWords?.[dict]) {
            this.plugin.settings.customSubWords[dict] = this.plugin.settings.customSubWords[dict].filter((x) => x !== word);
          }
          await this.plugin.saveSettings();
          new Notice(`Removed "${word}"`);
          this.renderModal();
        });
      });
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

// Modal 3: one-time opt-in prompt for the optional dictionary download
class FrequencyDownloadModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Download frequency dictionaries?" });
    contentEl.createEl("p", {
      text: "Silent Autocorrect can use two English word-frequency files (about 6.5 MB) to tell real words from typos and to fix spacing slips such as \"inthe\". They are downloaded once from GitHub (raw.githubusercontent.com) and saved in this plugin's folder. Nothing you write is sent anywhere. You can also do this later from the plugin settings.",
    });
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Download")
          .setCta()
          .onClick(async () => {
            await this.finish();
            this.close();
            await this.plugin.downloadFrequencyData();
          })
      )
      .addButton((btn) =>
        btn.setButtonText("Not now").onClick(async () => {
          await this.finish();
          this.close();
        })
      );
  }

  async finish() {
    this.plugin.settings.freqDownloadPrompted = true;
    await this.plugin.saveData(this.plugin.settings);
  }

  onClose() {
    this.contentEl.empty();
  }
}

// Settings Tab
class SilentAutocorrectSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    // Section 1: Add new word to dictionary
    new Setting(containerEl).setName("Add word to dictionary").setHeading();

    let inputWord = "";
    let selectedSubDict = "cardiology";

    new Setting(containerEl)
      .setName("Add new term")
      .setDesc("Word will be recognized across all notes and protected from auto-correct.")
      .addText((text) => text.setPlaceholder("e.g. neurogenesis").onChange((v) => (inputWord = v)))
      .addDropdown((drop) => {
        drop.addOption("cardiology", "Cardiology");
        drop.addOption("pharmacology", "Pharmacology");
        drop.addOption("surgery", "Surgery");
        drop.addOption("neurology", "Neurology");
        drop.addOption("pathology", "Pathology");
        drop.addOption("anatomy", "Anatomy");
        drop.addOption("custom", "Custom Words");
        drop.setValue(selectedSubDict);
        drop.onChange((val) => (selectedSubDict = val));
      })
      .addButton((btn) =>
        btn
          .setButtonText("Add Word")
          .setCta()
          .onClick(async () => {
            const clean = inputWord.trim().toLowerCase();
            if (!clean) return;
            await this.plugin.addWordToSubDict(selectedSubDict, clean);
            this.display();
          })
      );

    // Section 2: General & Sensitivity Controls
    new Setting(containerEl).setName("General").setHeading();

    new Setting(containerEl)
      .setName("Enable real-time auto-correct")
      .setDesc("Automatically corrects typos as you type upon hitting Space or punctuation.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoCorrectEnabled).onChange(async (val) => {
          this.plugin.settings.autoCorrectEnabled = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Undo on backspace")
      .setDesc("Pressing Backspace right after an auto-correction restores your original word.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.undoOnBackspace).onChange(async (val) => {
          this.plugin.settings.undoOnBackspace = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Auto-correct sensitivity")
      .setDesc("Ultra (35%), Proactive (45%), Balanced (52%, Word-like default), Strict (68%), or Minimal (tables and shorthands only). Spell-checker corrections need Obsidian's Settings > Editor > Spellcheck turned on.")
      .addDropdown((drop) =>
        drop
          .addOption("ultra", "Ultra (Fastest)")
          .addOption("proactive", "Proactive (High Sensitivity)")
          .addOption("balanced", "Balanced (Default)")
          .addOption("strict", "Strict (Conservative)")
          .addOption("minimal", "Minimal (Verified Only)")
          .setValue(this.plugin.settings.autocorrectSensitivity || "balanced")
          .onChange(async (val) => {
            this.plugin.settings.autocorrectSensitivity = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Use frequency dictionary")
      .setDesc("Uses the downloaded word-frequency files to tell real words from typos and pick the most likely fix.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.useFrequencyDictionary !== false).onChange(async (val) => {
          this.plugin.settings.useFrequencyDictionary = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Fix split and merged words")
      .setDesc('Fixes spacing slips such as "ism y name" -> "is my name", "inthe" -> "in the" and "wh at" -> "what". Needs the downloaded dictionaries.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.fixSplitMergeErrors !== false).onChange(async (val) => {
          this.plugin.settings.fixSplitMergeErrors = val;
          await this.plugin.saveSettings();
        })
      );

    const fs = this.plugin.freqStatus || { state: "loading", words: 0, bigrams: 0, detail: "" };
    const fsText =
      fs.state === "loaded"
        ? `Loaded ${fs.words.toLocaleString()} words` + (fs.bigrams ? ` and ${fs.bigrams.toLocaleString()} word pairs.` : `. ${fs.detail}`)
        : fs.state === "loading"
        ? "Loading..."
        : fs.detail;
    new Setting(containerEl)
      .setName("Frequency dictionaries")
      .setDesc((fsText.endsWith(".") ? fsText : fsText + ".") + " Downloaded once from GitHub (about 6.5 MB) and stored in the plugin folder.")
      .addButton((btn) =>
        btn
          .setButtonText(fs.state === "loaded" ? "Download again" : "Download")
          .setDisabled(!!this.plugin.freqDownloading)
          .onClick(async () => {
            await this.plugin.downloadFrequencyData();
            this.display();
          })
      );

    // Section 3: Clinical Shorthands
    new Setting(containerEl).setName("Clinical shorthands").setHeading();

    new Setting(containerEl)
      .setName("Enable clinical shorthands")
      .setDesc("Expands clinical acronyms (e.g. pt -> patient, hx -> history, dx -> diagnosis).")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.shorthandsEnabled).onChange(async (val) => {
          this.plugin.settings.shorthandsEnabled = val;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    if (this.plugin.settings.shorthandsEnabled) {
      for (const [key, sh] of Object.entries(this.plugin.settings.clinicalShorthands)) {
        new Setting(containerEl)
          .setName(`${key} → ${sh.expansion}`)
          .setDesc(`Category: ${sh.category}`)
          .addToggle((toggle) =>
            toggle.setValue(sh.enabled).onChange(async (val) => {
              this.plugin.settings.clinicalShorthands[key].enabled = val;
              await this.plugin.saveSettings();
            })
          )
          .addDropdown((drop) =>
            drop
              .addOption("silent", "Silent auto-correct")
              .addOption("underline", "Underline only")
              .setValue(sh.mode)
              .onChange(async (val) => {
                this.plugin.settings.clinicalShorthands[key].mode = val;
                await this.plugin.saveSettings();
              })
          );
      }
    }

    // Section 4: Medical sub-dictionaries
    new Setting(containerEl).setName("Medical sub-dictionaries").setHeading();

    for (const [id, sub] of Object.entries(this.plugin.settings.subDictionaries)) {
      new Setting(containerEl)
        .setName(sub.name)
        .setDesc(sub.description)
        .addToggle((toggle) =>
          toggle.setValue(sub.enabled).onChange(async (val) => {
            this.plugin.settings.subDictionaries[id].enabled = val;
            await this.plugin.saveSettings();
          })
        )
        .addDropdown((drop) =>
          drop
            .addOption("silent", "Silent auto-correct")
            .addOption("underline", "Underline only")
            .setValue(sub.mode)
            .onChange(async (val) => {
              this.plugin.settings.subDictionaries[id].mode = val;
              await this.plugin.saveSettings();
            })
        );
    }
  }
}

module.exports = SilentAutocorrectPlugin;
module.exports.AutoCorrectEngine = AutoCorrectEngine;

/* nosourcemap */