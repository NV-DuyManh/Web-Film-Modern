/**
 * Gender Detection Utility
 * Phân tích giới tính dựa trên tên (first name) của diễn viên/đạo diễn.
 * Hỗ trợ: Western, Japanese, Korean, Chinese, Vietnamese, Thai, Hindi, Spanish, French, German, Arabic, Russian...
 * Nếu không xác định được → trả về "Other".
 */

const FEMALE_FIRST_NAMES = new Set([
    // ===== JAPANESE FEMALE (250+) =====
    'yui', 'sakura', 'hana', 'aoi', 'mei', 'mio', 'rin', 'yuna', 'haruka', 'misaki',
    'akari', 'riko', 'hinata', 'saki', 'nana', 'mana', 'yuki', 'aya', 'asuka', 'yuka',
    'mai', 'maki', 'emi', 'sora', 'kana', 'miyu', 'mayu', 'chika', 'nao', 'miku',
    'ai', 'midori', 'tomoko', 'reiko', 'ayumi', 'megumi', 'keiko', 'yoko', 'kyoko',
    'naomi', 'fumiko', 'junko', 'mariko', 'noriko', 'sachiko', 'takako', 'yoshiko',
    'akiko', 'atsuko', 'chieko', 'eiko', 'haruko', 'kazuko', 'kumiko', 'mayumi',
    'miyuki', 'nobuko', 'ryoko', 'sanae', 'sayuri', 'shizuka', 'sumiko', 'tamaki',
    'teruko', 'tomoe', 'yasuko', 'yumiko', 'kaori', 'minako', 'chihiro', 'shiori',
    'momoka', 'nanami', 'koharu', 'ayaka', 'honoka', 'kanon', 'miho', 'satomi',
    'risa', 'rika', 'yume', 'hikari', 'tsukasa', 'chiaki', 'manami', 'natsuki',
    'hitomi', 'izumi', 'kaho', 'kotone', 'misa', 'mizuki', 'nozomi', 'saori',
    'seira', 'suzu', 'tomoyo', 'wakana', 'yukiko', 'yuriko', 'ami', 'arisa',
    'chisato', 'eriko', 'hiroko', 'kanako', 'mami', 'masumi', 'michiko', 'minami',
    'misato', 'mitsuki', 'nagisa', 'natsumi', 'orie', 'ran', 'rei', 'rena',
    'ruriko', 'seiko', 'shiho', 'shoko', 'suzuka', 'tamao', 'yayoi', 'yuria',
    'chiyo', 'fumi', 'haru', 'hotaru', 'iori', 'kaede', 'kasumi', 'kiriko',
    'kokoro', 'kozue', 'madoka', 'mahiru', 'makiko', 'matsuri', 'mayuko', 'mieko',
    'mikako', 'mikoto', 'minori', 'moe', 'moeka', 'momo', 'momoko', 'mutsumi',
    'naho', 'nanako', 'naoko', 'natsu', 'otoha', 'sae', 'saeko', 'sana',
    'sawako', 'sayaka', 'shino', 'shinobu', 'shion', 'tae', 'takiko', 'tokiko',
    'tsubaki', 'tsubasa', 'tsukiko', 'utako', 'waka', 'yoriko', 'yua', 'yuiko',
    'yukari', 'yuko', 'yurika', 'kurumi', 'mirai', 'hina', 'himari', 'ichika',
    'tsumugi', 'rio', 'kokona', 'an', 'hiyori', 'akane', 'tsuki',
    'rui', 'sara', 'iroha', 'sumire', 'karin', 'airi', 'yuina', 'mone',

    // ===== KOREAN FEMALE (150+) =====
    'jiyeon', 'sooyeon', 'minji', 'soyeon', 'yejin', 'jihye', 'eunji',
    'yoona', 'jiwon', 'hyejin', 'sunhee', 'jisoo', 'boyoung', 'minyoung',
    'sohee', 'yeri', 'sejeong', 'hyojin', 'dahye', 'yoojung', 'suzy',
    'soojin', 'yeonhee', 'eunhye', 'jihyun', 'sunmi', 'hyeri', 'naeun',
    'seulgi', 'irene', 'wendy', 'joy', 'yuna', 'ryujin', 'yeji', 'lia',
    'chaeryeong', 'yunjin', 'kazuha', 'sakura', 'chaewon', 'eunchae', 'garam',
    'minju', 'wonyoung', 'yujin', 'gaeul', 'liz', 'leeseo', 'haerin',
    'danielle', 'hanni', 'hyein', 'minnie', 'miyeon', 'soyeon', 'yuqi',
    'shuhua', 'nayeon', 'jeongyeon', 'momo', 'jihyo', 'mina', 'dahyun',
    'chaeyoung', 'tzuyu', 'jennie', 'lisa', 'rose', 'jisoo', 'solar',
    'moonbyul', 'wheein', 'hwasa', 'taeyeon', 'tiffany', 'hyoyeon', 'yuri',
    'sooyoung', 'yoona', 'seohyun', 'krystal', 'sulli', 'victoria',
    'bora', 'hyolyn', 'soyou', 'dasom', 'gayoon', 'jiyoon', 'hyuna',
    'sunhwa', 'hani', 'junghwa', 'solji', 'heejin', 'hyunjin', 'haseul',
    'vivi', 'yves', 'chuu', 'gowon', 'olivia', 'jinsoul', 'choerry', 'yeojin',
    'soeun', 'hayoung', 'chorong', 'bomi', 'namjoo', 'eunji',
    'somin', 'jiwoo', 'youjeong', 'suyun', 'yeeun', 'seonghee', 'yoohyeon',
    'dami', 'gahyeon', 'sua', 'handong', 'jiu', 'yeseo', 'xiaoting',
    'mashiro', 'dayeon', 'hikaru', 'huening', 'sullyoon', 'jinni', 'kyujin',
    'haewon', 'bae', 'jihan',

    // ===== WESTERN FEMALE (400+) =====
    'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
    'jessica', 'sarah', 'karen', 'lisa', 'nancy', 'betty', 'margaret', 'sandra',
    'ashley', 'dorothy', 'kimberly', 'emily', 'donna', 'michelle', 'carol',
    'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura',
    'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda',
    'pamela', 'emma', 'nicole', 'helen', 'samantha', 'katherine', 'christine',
    'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather',
    'diane', 'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria',
    'kelly', 'lauren', 'christina', 'joan', 'evelyn', 'judith', 'megan',
    'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria', 'teresa',
    'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean',
    'abigail', 'alice', 'judy', 'sophia', 'grace', 'denise', 'amber',
    'doris', 'marilyn', 'danielle', 'beverly', 'isabella', 'theresa', 'diana',
    'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori',
    'scarlett', 'natasha', 'angelina', 'chloe', 'mia', 'zoe', 'lily', 'eva',
    'kate', 'anne', 'rose', 'clara', 'ella', 'julia', 'lucy', 'stella',
    'audrey', 'nina', 'sofia', 'elsa', 'greta', 'ingrid', 'brigitte',
    'penelope', 'violet', 'hazel', 'aurora', 'savannah', 'brooklyn', 'leah',
    'zara', 'eleanor', 'maya', 'willow', 'paisley', 'ariana', 'ruby',
    'isla', 'ivy', 'elena', 'camila', 'valentina', 'gianna',
    'aubrey', 'jade', 'piper', 'daisy', 'cora', 'freya',
    'margot', 'florence', 'brie', 'lupita', 'saoirse', 'gal',
    'genevieve', 'josephine', 'adalyn', 'adeline', 'alina', 'annika',
    'arianna', 'athena', 'autumn', 'avery', 'bailey', 'beatrice', 'bianca',
    'blair', 'bonnie', 'brooke', 'callie', 'caroline', 'cecilia', 'celeste',
    'colleen', 'constance', 'corinne', 'courtney', 'crystal', 'daphne',
    'darlene', 'dawn', 'deanna', 'delia', 'delilah', 'desiree',
    'elaine', 'elise', 'emilia', 'erica', 'esther', 'faith', 'faye',
    'felicity', 'fiona', 'gabriella', 'giselle', 'gwendolyn',
    'hallie', 'harmony', 'harriet', 'heidi', 'hilary', 'holly', 'hope',
    'imogen', 'ines', 'iris', 'ivy', 'jada', 'jasmine', 'jenna',
    'joanna', 'jocelyn', 'jordan', 'joy', 'juliana', 'june', 'kaia',
    'kaitlyn', 'kamila', 'kara', 'katarina', 'kaylee', 'keira', 'kendall',
    'kennedy', 'khloe', 'kiara', 'kristen', 'kylie', 'lacey', 'lana',
    'layla', 'leia', 'lena', 'leona', 'leslie', 'leticia', 'liliana',
    'lillian', 'lola', 'lorraine', 'louisa', 'lucia', 'lydia', 'mabel',
    'mackenzie', 'madeleine', 'maeve', 'maggie', 'maisie', 'mallory',
    'marcia', 'mariana', 'marigold', 'marina', 'marissa', 'marlene',
    'matilda', 'maureen', 'maxine', 'melanie', 'melody', 'mercedes',
    'meredith', 'miranda', 'moira', 'molly', 'monica', 'morgan',
    'muriel', 'myrtle', 'nadia', 'nadine', 'nellie', 'nora', 'noelle',
    'opal', 'ophelia', 'paige', 'paloma', 'paulina', 'pearl', 'phoebe',
    'polly', 'poppy', 'priscilla', 'quinn', 'ramona', 'raquel',
    'regina', 'renee', 'rhea', 'riley', 'roberta', 'rochelle', 'rosalind',
    'rosemary', 'roxanne', 'sabrina', 'sadie', 'sage', 'sally', 'sasha',
    'selena', 'serena', 'shelby', 'sienna', 'simone', 'skye', 'sloane',
    'stacy', 'summer', 'susanna', 'tabitha', 'tamara', 'tanya', 'tara',
    'tatiana', 'taylor', 'thalia', 'tina', 'tracy', 'trinity', 'trudy',
    'ursula', 'valerie', 'vanessa', 'vera', 'veronica', 'vivian', 'wanda',
    'whitney', 'winona', 'ximena', 'yolanda', 'yvette', 'yvonne', 'zelda',

    // ===== SPANISH/LATIN FEMALE (100+) =====
    'alejandra', 'alicia', 'ana', 'beatriz', 'blanca', 'carmen', 'catalina',
    'cecilia', 'clara', 'claudia', 'consuelo', 'cristina', 'daniela', 'dolores',
    'elena', 'esperanza', 'estrella', 'fernanda', 'gabriela', 'guadalupe',
    'ines', 'isabel', 'jimena', 'josefina', 'juana', 'lourdes', 'lucia',
    'luisa', 'luz', 'magdalena', 'maribel', 'marisol', 'marta', 'mercedes',
    'milagros', 'natalia', 'nuria', 'paloma', 'paula', 'pilar', 'rafaela',
    'rosa', 'rosario', 'silvia', 'sol', 'soledad', 'susana', 'teresa',
    'valentina', 'veronica', 'yolanda', 'ximena', 'rocio', 'lola',
    'adriana', 'agustina', 'amparo', 'aurora', 'belen', 'carlota', 'carolina',
    'concha', 'encarnacion', 'eugenia', 'fatima', 'florencia', 'francisca',
    'graciela', 'irene', 'josefa', 'julia', 'laura', 'leticia', 'lorena',
    'manuela', 'margarita', 'mariana', 'monica', 'olga', 'patricia', 'penelope',
    'raquel', 'rebeca', 'regina', 'renata', 'salma', 'sandra', 'sofia',
    'sonia', 'tatiana', 'victoria', 'virginia', 'viviana',

    // ===== FRENCH FEMALE (80+) =====
    'adele', 'agathe', 'aimee', 'amelie', 'anais', 'angeline', 'antoinette',
    'bernadette', 'brigitte', 'camille', 'celine', 'chantal', 'charlotte',
    'claire', 'claude', 'clemence', 'colette', 'corinne', 'delphine', 'denise',
    'dominique', 'edith', 'eliane', 'elise', 'emilie', 'estelle', 'evelyne',
    'fabienne', 'fleur', 'francoise', 'genevieve', 'gisele', 'helene',
    'henriette', 'isabelle', 'jacqueline', 'jeanne', 'josephine', 'juliette',
    'laetitia', 'lea', 'leonie', 'liliane', 'lisette', 'louise', 'lucienne',
    'madeleine', 'manon', 'marguerite', 'marianne', 'martine', 'mathilde',
    'monique', 'nathalie', 'noemi', 'odette', 'pascale', 'pauline', 'renee',
    'rosalie', 'sabine', 'sandrine', 'simone', 'solange', 'sophie', 'sylvie',
    'therese', 'valerie', 'veronique', 'virginie', 'vivienne', 'yvette',
    'yvonne', 'zoe', 'aurelie', 'chloe', 'clemence', 'ines', 'jade',
    'lena', 'lola', 'luna', 'margaux', 'oceane', 'romane',

    // ===== GERMAN FEMALE (60+) =====
    'anneliese', 'astrid', 'birgit', 'brunhilde', 'christa', 'dagmar', 'elke',
    'erika', 'frieda', 'gertrud', 'gisela', 'gudrun', 'hannelore', 'hedwig',
    'heike', 'helga', 'hilde', 'ilse', 'inge', 'ingeborg', 'ingrid',
    'irma', 'johanna', 'karin', 'katja', 'liesel', 'lotte', 'margarete',
    'marlene', 'meike', 'monika', 'petra', 'renate', 'rosa', 'roswitha',
    'sabine', 'sigrid', 'silke', 'stefanie', 'susanne', 'ulrike', 'ursula',
    'uta', 'waltraud', 'anke', 'bettina', 'claudia', 'doris', 'eva',
    'frauke', 'gabriele', 'jana', 'jutta', 'lara', 'leonie', 'maja',
    'maren', 'mila', 'nele', 'sonja', 'tanja', 'vera',

    // ===== RUSSIAN FEMALE (60+) =====
    'alina', 'anastasia', 'anna', 'daria', 'ekaterina', 'elena', 'galina',
    'irina', 'ksenia', 'larisa', 'lilia', 'liudmila', 'lyubov', 'marina',
    'nadezhda', 'natalia', 'nina', 'olga', 'oksana', 'polina', 'sofiya',
    'svetlana', 'tamara', 'tatiana', 'valentina', 'vera', 'viktoria', 'yulia',
    'zhanna', 'zoya', 'alla', 'diana', 'evgenia', 'inna', 'kira',
    'kristina', 'lada', 'masha', 'mila', 'natalya', 'nastya', 'olesya',
    'raisa', 'rita', 'sasha', 'snezhana', 'veronika', 'yana', 'yekaterina',
    'zinaida', 'alena', 'anfisa', 'lyudmila', 'margarita', 'milena', 'nelly',
    'vasilisa', 'vlada', 'varvara',

    // ===== CHINESE FEMALE (80+) =====
    'fei', 'ling', 'xiu', 'yan', 'ying', 'zhen', 'jing', 'xia',
    'na', 'ping', 'qing', 'rong', 'shan', 'shu', 'ting', 'wen',
    'xin', 'yun', 'fang', 'gui', 'hui', 'juan', 'lian', 'qin', 'xiao', 'zhu',
    'bingbing', 'yifei', 'liying', 'ziyi', 'dongyu', 'yuqi',
    'xiulan', 'meili', 'yuxin', 'xinyi', 'ruoxi', 'qianqian', 'lingling',
    'xiaoli', 'xiaomei', 'xiaoyan', 'xiaoling', 'xiaohong', 'xiaofang',
    'chunhua', 'guiying', 'xiuying', 'lanying', 'yulan', 'xiuzhen',
    'shulan', 'guizhen', 'fenying', 'shuzhen', 'cuiping', 'xiuhua',

    // ===== VIETNAMESE FEMALE (80+) =====
    'ánh', 'bích', 'châu', 'dung', 'diễm', 'diệu', 'đào',
    'hạnh', 'hằng', 'hồng', 'hoa', 'huệ', 'hương', 'hiền', 'huyền',
    'kim', 'lan', 'lệ', 'linh', 'liên', 'loan', 'ly', 'mỹ', 'my',
    'nga', 'ngân', 'ngọc', 'nhung', 'nhi', 'như', 'oanh', 'phương', 'quỳnh', 'quyên',
    'thảo', 'thắm', 'thúy', 'trang', 'trinh', 'trúc', 'tuyết', 'uyên',
    'vân', 'vi', 'yến', 'vy', 'thủy', 'tiên', 'nhàn',
    'cúc', 'sen', 'duyên', 'thơ', 'trà', 'lài', 'hà', 'thu',
    'mai', 'xuân', 'giang', 'khánh', 'thanh', 'an', 'anh',
    'hậu', 'tâm', 'ý', 'nương', 'lam', 'hạ',

    // ===== THAI FEMALE (50+) =====
    'ploy', 'pim', 'fern', 'noi', 'aom', 'bow', 'jui', 'noon', 'yaya',
    'mint', 'ice', 'bee', 'palm', 'mew', 'kwan', 'mo', 'earn', 'belle', 'baifern',
    'namtan', 'praew', 'janie', 'oil', 'kate', 'prae', 'nychaa', 'june',
    'noey', 'toey', 'mild', 'chippy', 'pie', 'pinky', 'pang', 'fah',
    'bua', 'dao', 'duang', 'jan', 'jit', 'kaew', 'lalana', 'malai',
    'nid', 'nueng', 'on', 'orn', 'patchara', 'pen', 'ratana', 'sai',
    'somying', 'suda', 'sunee', 'supha', 'suphan', 'thip', 'wan', 'wanna',

    // ===== HINDI/INDIAN FEMALE (100+) =====
    'aarti', 'aditi', 'aishwarya', 'amala', 'amrita', 'ananya', 'aneesa',
    'anita', 'anjali', 'anusha', 'archana', 'aruna', 'asha', 'bhavana',
    'chandra', 'deepa', 'deepika', 'devika', 'devi', 'diya', 'durga',
    'ganga', 'gauri', 'geeta', 'hema', 'indira', 'isha', 'jaya',
    'jyoti', 'kajal', 'kamala', 'kalpana', 'kangana', 'kareena', 'karishma',
    'kavita', 'kiara', 'kriti', 'lata', 'lakshmi', 'lalita', 'madhuri',
    'malika', 'maya', 'meena', 'meera', 'megha', 'mohini', 'naina',
    'nalini', 'nandini', 'neha', 'nisha', 'nita', 'padma', 'pallavi',
    'parvati', 'pooja', 'prachi', 'priti', 'priya', 'priyanka', 'radha',
    'rani', 'rashi', 'rashmi', 'rekha', 'ritu', 'riya', 'rohini',
    'sakshi', 'sandhya', 'sarita', 'savita', 'seema', 'shanti', 'shilpa',
    'shreya', 'shruti', 'sita', 'smita', 'sneha', 'sonali', 'sonam',
    'sonia', 'sridevi', 'sunita', 'sushma', 'swati', 'tanvi', 'tara',
    'uma', 'usha', 'vaani', 'vanita', 'varsha', 'vidya', 'vimala',

    // ===== ARABIC FEMALE (40+) =====
    'aaliyah', 'aisha', 'amina', 'dina', 'fatima', 'hala', 'halima',
    'huda', 'jamila', 'khadija', 'laila', 'leila', 'lina', 'maha',
    'mariam', 'mona', 'nadia', 'nawal', 'noor', 'noura', 'rania',
    'reem', 'rim', 'sabah', 'salma', 'samira', 'sara', 'soraya',
    'yara', 'yasmin', 'zahra', 'zainab', 'zubaida', 'amira', 'basma',
    'dalal', 'dalila', 'habiba', 'hanaa', 'hayat', 'inaam', 'inas',

    // ===== ITALIAN FEMALE (40+) =====
    'alessandra', 'alessia', 'alice', 'antonella', 'arianna', 'beatrice',
    'benedetta', 'bianca', 'carlotta', 'caterina', 'chiara', 'cinzia',
    'concetta', 'daniela', 'eleonora', 'elisa', 'emanuela', 'federica',
    'francesca', 'gaia', 'giada', 'giorgia', 'giovanna', 'giulia',
    'grazia', 'ilaria', 'laura', 'lorella', 'lorenza', 'lucia',
    'luisa', 'margherita', 'marta', 'martina', 'michela', 'paola',
    'patrizia', 'raffaella', 'roberta', 'rosa', 'rossella', 'sabrina',
    'serena', 'silvia', 'simona', 'sofia', 'stefania', 'valentina',
    'vanessa', 'veronica', 'virginia',

    // ===== PORTUGUESE FEMALE (30+) =====
    'adriana', 'aline', 'amanda', 'ana', 'andreia', 'beatriz', 'bruna',
    'camila', 'carolina', 'catarina', 'daniela', 'fernanda', 'gabriela',
    'ines', 'joana', 'juliana', 'larissa', 'leticia', 'luana', 'lucia',
    'mariana', 'monica', 'patricia', 'paula', 'raquel', 'renata',
    'sandra', 'sara', 'sofia', 'tatiana', 'vanessa', 'viviane',

    // ===== SCANDINAVIAN FEMALE (30+) =====
    'astrid', 'birgit', 'dagny', 'ebba', 'edda', 'elina', 'frida',
    'gunhild', 'hedda', 'helga', 'hilde', 'inga', 'ingrid', 'karin',
    'kirsten', 'liv', 'maja', 'margit', 'nora', 'saga', 'sigrid',
    'signe', 'solveig', 'sunniva', 'svea', 'thea', 'tove', 'tyra',
    'vigdis', 'ylva',

    // ===== POLISH FEMALE (20+) =====
    'agnieszka', 'aleksandra', 'anna', 'beata', 'dorota', 'ewa', 'halina',
    'hanna', 'iwona', 'joanna', 'katarzyna', 'krystyna', 'malgorzata',
    'monika', 'renata', 'teresa', 'wanda', 'zofia', 'zuzanna',

    // ===== TURKISH FEMALE (20+) =====
    'ayse', 'elif', 'emine', 'fatma', 'hatice', 'merve', 'zeynep',
    'busra', 'esra', 'kubra', 'seda', 'tugba', 'derya', 'gamze',
    'gul', 'hulya', 'leyla', 'melek', 'mine', 'nur', 'ozge', 'pinar',
    'sevgi', 'sibel', 'sultan', 'yasemin',
]);

const MALE_FIRST_NAMES = new Set([
    // ===== JAPANESE MALE (200+) =====
    'takeshi', 'hiroshi', 'kenji', 'daisuke', 'yusuke', 'takuya', 'shun', 'ryo',
    'kazuki', 'haruto', 'yuto', 'sota', 'ren', 'kaito', 'hayato', 'ryota', 'kenta',
    'daiki', 'tatsuya', 'naoto', 'akira', 'makoto', 'taro', 'ichiro', 'jiro',
    'shin', 'ken', 'masashi', 'ryuichi', 'noboru', 'takashi', 'mamoru', 'satoshi',
    'yuji', 'koji', 'osamu', 'hideaki', 'kazuo', 'masato', 'tsutomu', 'yasushi',
    'shinji', 'tetsuya', 'tomohiro', 'yoshiki', 'goro', 'isao', 'koichi', 'minoru',
    'norio', 'seiji', 'shigeru', 'tadashi', 'toshio', 'wataru', 'katsuhiro',
    'hayao', 'isamu', 'kunio', 'masahiro', 'naohito', 'susumu', 'toshiki',
    'hideki', 'hiroki', 'junichi', 'katsumi', 'kazuhiko', 'kazuya', 'kensuke',
    'kohei', 'masaki', 'masayuki', 'mitsuo', 'naoki', 'nobuyuki', 'ryosuke',
    'saburo', 'seiichi', 'shinichi', 'shoji', 'shuichi', 'soichiro', 'taichi',
    'takahiro', 'takao', 'takumi', 'teruo', 'tomoaki', 'tomoya', 'toshiaki',
    'yasuhiro', 'yasuo', 'yoshio', 'yosuke', 'yuichi', 'yukio', 'yusaku',
    'atsushi', 'eisaku', 'fumihiko', 'genzo', 'hajime', 'hideo', 'hidetoshi',
    'hiromasa', 'hironobu', 'hitoshi', 'hisashi', 'ikuo', 'joji', 'junya',
    'keiichi', 'keisuke', 'kengo', 'kenshin', 'kentaro', 'kiichi', 'kosei',
    'kunihiko', 'masamune', 'michihiro', 'mitsuru', 'motoki', 'munehiro',
    'nagisa', 'nobuhiro', 'nobuaki', 'noriyuki', 'ryoichi', 'ryoma', 'ryunosuke',
    'sadao', 'sho', 'shota', 'shuhei', 'shunsuke', 'sosuke', 'subaru',
    'suguru', 'sumio', 'sunao', 'taiga', 'taisuke', 'takeru', 'tatsuro',
    'teppei', 'tomonori', 'toru', 'tsuyoshi', 'yoichi', 'yoshihiro', 'yuki',

    // ===== KOREAN MALE (100+) =====
    'jihoon', 'minho', 'seunggi', 'hyunbin', 'jongsuk', 'junki', 'woobin',
    'soohyun', 'dongwook', 'jaehyun', 'sunghoon', 'yooseok', 'bogum',
    'seojoon', 'joongki', 'changwook', 'doohyun', 'joohuyk',
    'wooshik', 'kangho', 'jungjae', 'jungsuk', 'byunghun', 'woosung',
    'donggun', 'jiseob', 'insung', 'jisung', 'donghae', 'siwon', 'kyuhyun',
    'leeteuk', 'heechul', 'yesung', 'eunhyuk', 'donghae', 'shindong',
    'jimin', 'taehyung', 'jungkook', 'namjoon', 'yoongi', 'hoseok', 'seokjin',
    'chanyeol', 'baekhyun', 'sehun', 'kai', 'suho', 'xiumin', 'chen', 'lay',
    'gdragon', 'taeyang', 'daesung', 'seungri', 'top',
    'minsoo', 'jinyoung', 'jaebum', 'youngjae', 'bambam', 'yugyeom',
    'changbin', 'hyunjin', 'felix', 'seungmin', 'jeongin', 'bangchan',
    'taeyong', 'doyoung', 'jaehyun', 'jungwoo', 'haechan', 'johnny', 'yuta',
    'san', 'wooyoung', 'yunho', 'mingi', 'hongjoong', 'seonghwa', 'jongho',

    // ===== WESTERN MALE (500+) =====
    'james', 'robert', 'john', 'michael', 'david', 'william', 'richard', 'joseph',
    'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark',
    'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian',
    'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan', 'jacob',
    'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
    'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander',
    'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam',
    'nathan', 'henry', 'peter', 'zachary', 'douglas', 'harold', 'carl', 'arthur',
    'gerald', 'keith', 'roger', 'terry', 'sean', 'austin', 'ralph', 'roy',
    'eugene', 'randy', 'wayne', 'vincent', 'albert', 'bruce', 'willie', 'gabriel',
    'logan', 'dylan', 'alan', 'juan', 'russell', 'louis', 'philip', 'bobby',
    'johnny', 'bradley', 'tom', 'ben', 'chris', 'matt', 'nick', 'mike', 'joe',
    'bob', 'bill', 'jim', 'steve', 'jeff', 'brad', 'tony', 'greg', 'dan',
    'leonardo', 'keanu', 'morgan', 'denzel', 'sylvester', 'arnold', 'clint', 'harrison',
    'mel', 'nicolas', 'liam', 'noah', 'oliver', 'elijah', 'lucas', 'mason', 'ethan',
    'aiden', 'sebastian', 'caleb', 'owen', 'luke', 'max', 'leo', 'felix', 'hugo',
    'oscar', 'theo', 'miles', 'finn', 'cole', 'kai', 'remy', 'pedro', 'joaquin',
    'benedict', 'cillian', 'idris', 'dwayne', 'hugh', 'colin', 'jude', 'eddie',
    'kit', 'tobey', 'jake', 'josh', 'will', 'vin', 'heath', 'orlando',
    'abel', 'abraham', 'adrian', 'aidan', 'alec', 'alfie', 'alfred', 'alonzo',
    'ambrose', 'amos', 'anderson', 'andre', 'andy', 'angelo', 'angus',
    'archie', 'arlo', 'armand', 'asher', 'atticus', 'axel', 'barnaby',
    'barry', 'basil', 'beckett', 'benny', 'bernard', 'bert', 'blake',
    'bodhi', 'boris', 'brent', 'brett', 'brooks', 'bruno', 'bryce',
    'byron', 'calvin', 'cameron', 'carl', 'carlos', 'carter', 'casey',
    'cedric', 'cesar', 'chad', 'chandler', 'chase', 'chester', 'clark',
    'claude', 'clay', 'clayton', 'clement', 'clifford', 'clive', 'cody',
    'connor', 'conrad', 'corey', 'cornelius', 'craig', 'cruz', 'curtis',
    'cyrus', 'dale', 'dallas', 'damian', 'damon', 'dane', 'dante',
    'darcy', 'darius', 'darren', 'darwin', 'dean', 'declan', 'derek',
    'desmond', 'devin', 'dexter', 'diego', 'dirk', 'dominic', 'donovan',
    'dorian', 'drake', 'drew', 'duke', 'duncan', 'dustin', 'dwight',
    'earl', 'edgar', 'edmund', 'elias', 'elliot', 'ellis', 'elton',
    'elvis', 'emerson', 'emilio', 'emmett', 'enrique', 'ernest', 'erwin',
    'evan', 'everett', 'ezra', 'fabian', 'fernando', 'fletcher', 'floyd',
    'ford', 'forrest', 'foster', 'fox', 'francis', 'francisco', 'fraser',
    'fred', 'frederick', 'fritz', 'garrett', 'gavin', 'gene', 'geoffrey',
    'gilbert', 'glenn', 'gordon', 'graham', 'grant', 'grayson', 'griffin',
    'grover', 'gunnar', 'gustavo', 'guy', 'hank', 'hans', 'harley',
    'harold', 'harris', 'harry', 'harvey', 'hector', 'herman', 'homer',
    'howard', 'hudson', 'hunter', 'ian', 'igor', 'isaac', 'ivan',
    'jace', 'jaden', 'jaime', 'jake', 'jalen', 'jameson', 'jared',
    'jarvis', 'jasper', 'javier', 'jay', 'jed', 'jefferson', 'jensen',
    'jesse', 'jesus', 'joel', 'jonas', 'jordan', 'jorge', 'jude',
    'julian', 'julius', 'kane', 'karl', 'keegan', 'kellen', 'kelvin',
    'kendrick', 'kent', 'kian', 'killian', 'kingsley', 'kirk', 'knox',
    'kurt', 'kyle', 'lance', 'landon', 'lars', 'lawrence', 'layne',
    'lee', 'leon', 'leonard', 'leroy', 'levi', 'lewis', 'lincoln',
    'lionel', 'lloyd', 'lorenzo', 'luca', 'luis', 'luther', 'lyle',
    'maddox', 'magnus', 'malcolm', 'malik', 'manuel', 'marcel', 'marco',
    'marcus', 'mario', 'marshall', 'martin', 'marvin', 'maverick', 'maxwell',
    'melvin', 'merlin', 'micah', 'miguel', 'milo', 'mitchell', 'mohamed',
    'montgomery', 'morris', 'murphy', 'murray', 'myron', 'nate', 'ned',
    'neil', 'nelson', 'neville', 'nigel', 'noel', 'nolan', 'norbert',
    'norman', 'omar', 'orion', 'otis', 'otto', 'owen', 'pablo',
    'parker', 'pascal', 'percy', 'perry', 'philip', 'pierce', 'porter',
    'preston', 'quentin', 'quincy', 'rafael', 'ramon', 'randall', 'raphael',
    'ray', 'reed', 'reginald', 'reid', 'reuben', 'rex', 'rhett',
    'ricardo', 'rocco', 'roderick', 'rodney', 'rodrigo', 'roland', 'roman',
    'romeo', 'ronald', 'rory', 'ross', 'rowan', 'ruben', 'rudy',
    'rufus', 'rupert', 'santiago', 'sawyer', 'seth', 'shane', 'sheldon',
    'silas', 'simon', 'solomon', 'spencer', 'stanley', 'stefan', 'sterling',
    'stuart', 'sullivan', 'sylvester', 'tanner', 'ted', 'terrence', 'thaddeus',
    'theodore', 'tobias', 'todd', 'travis', 'trent', 'trevor', 'tristan',
    'troy', 'tucker', 'ulysses', 'uriel', 'vaughn', 'vernon', 'victor',
    'wade', 'walker', 'wallace', 'walter', 'warren', 'watson', 'wendell',
    'werner', 'wes', 'wesley', 'weston', 'wilder', 'willard', 'wilson',
    'winston', 'wolfgang', 'woodrow', 'wyatt', 'xavier', 'xander',
    'yusuf', 'zach', 'zane', 'zeke',

    // ===== SPANISH/LATIN MALE (80+) =====
    'alejandro', 'alfonso', 'alfredo', 'andres', 'angel', 'antonio', 'arturo',
    'benito', 'bernardo', 'carlos', 'cesar', 'claudio', 'cristobal', 'diego',
    'domingo', 'eduardo', 'emilio', 'enrique', 'ernesto', 'esteban', 'felipe',
    'felix', 'fernando', 'francisco', 'gerardo', 'gilberto', 'gonzalo',
    'guillermo', 'gustavo', 'hector', 'hernan', 'ignacio', 'ismael', 'javier',
    'jorge', 'jose', 'juan', 'julio', 'leonardo', 'lorenzo', 'luis',
    'manuel', 'marco', 'mario', 'martin', 'mateo', 'mauricio', 'miguel',
    'nestor', 'nicolas', 'octavio', 'omar', 'oscar', 'pablo', 'pedro',
    'rafael', 'ramon', 'raul', 'ricardo', 'roberto', 'rodrigo', 'ruben',
    'salvador', 'santiago', 'sebastian', 'sergio', 'silvio', 'tomas', 'valentin',
    'vicente', 'victor',

    // ===== FRENCH MALE (60+) =====
    'adrien', 'alain', 'alexandre', 'alexis', 'andre', 'antoine', 'arnaud',
    'bastien', 'benoit', 'bernard', 'bruno', 'cedric', 'christophe', 'clement',
    'damien', 'denis', 'didier', 'edouard', 'emile', 'etienne', 'fabien',
    'fabrice', 'florian', 'francois', 'frederic', 'gaston', 'georges',
    'gerard', 'gilbert', 'guillaume', 'gustave', 'henri', 'herve', 'hugues',
    'jacques', 'jean', 'jerome', 'joel', 'julien', 'laurent', 'lionel',
    'loic', 'louis', 'luc', 'lucien', 'marc', 'marcel', 'mathieu',
    'maurice', 'maxime', 'nicolas', 'olivier', 'pascal', 'patrice', 'philippe',
    'pierre', 'quentin', 'raphael', 'remi', 'rene', 'roland', 'sebastien',
    'serge', 'stephane', 'sylvain', 'thierry', 'valentin', 'xavier', 'yves',

    // ===== GERMAN MALE (50+) =====
    'albrecht', 'armin', 'axel', 'bernhard', 'burkhard', 'christian', 'christoph',
    'claus', 'detlef', 'dieter', 'dietrich', 'dirk', 'eberhard', 'ekkehard',
    'erwin', 'florian', 'franz', 'friedhelm', 'friedrich', 'georg', 'gerhard',
    'gottfried', 'gunter', 'gustav', 'hans', 'heinrich', 'helmut', 'herbert',
    'hermann', 'horst', 'joachim', 'johann', 'jorg', 'josef', 'juergen',
    'karl', 'klaus', 'kurt', 'lothar', 'ludwig', 'lukas', 'manfred',
    'markus', 'matthias', 'moritz', 'norbert', 'otto', 'rainer', 'ralf',
    'reinhard', 'rolf', 'rudolf', 'siegfried', 'stefan', 'thorsten', 'tobias',
    'uwe', 'volker', 'walther', 'werner', 'wilhelm', 'willi', 'wolfgang',

    // ===== RUSSIAN MALE (50+) =====
    'aleksandr', 'aleksei', 'andrei', 'anton', 'artem', 'boris', 'denis',
    'dmitri', 'dmitry', 'evgeni', 'evgeny', 'fedor', 'filipp', 'gennady',
    'georgi', 'grigory', 'igor', 'ilia', 'ivan', 'kirill', 'konstantin',
    'leonid', 'lev', 'maksim', 'matvei', 'mikhail', 'nikita', 'nikolai',
    'oleg', 'pavel', 'pyotr', 'roman', 'ruslan', 'sergei', 'sergey',
    'stanislav', 'stepan', 'timur', 'vadim', 'valentin', 'valery', 'vasily',
    'viktor', 'vitaly', 'vladimir', 'vladislav', 'yaroslav', 'yevgeny', 'yuri',

    // ===== CHINESE MALE (60+) =====
    'chen', 'cheng', 'gang', 'guo', 'hao', 'jian', 'jun', 'lei', 'long', 'ming',
    'peng', 'qiang', 'tao', 'wang', 'xiang', 'yang', 'yong', 'zhang', 'zheng', 'dong',
    'wei', 'bo', 'chao', 'da', 'feng', 'guang', 'hai', 'hang', 'jie', 'kai',
    'kang', 'liang', 'lin', 'nan', 'ning', 'qi', 'qian', 'shan', 'sheng', 'shuai',
    'song', 'tian', 'wen', 'wu', 'xin', 'xu', 'yi', 'yu', 'yue', 'zhe', 'zhi',

    // ===== VIETNAMESE MALE (80+) =====
    'bảo', 'bình', 'cường', 'dũng', 'dương', 'đạt', 'đức', 'hải', 'hoàng',
    'hùng', 'hưng', 'khải', 'khoa', 'kiên', 'long', 'lộc', 'mạnh', 'minh', 'nam',
    'nghĩa', 'nhân', 'phong', 'phú', 'quân', 'quang', 'sơn', 'tài', 'thành', 'thiện',
    'toàn', 'trí', 'trung', 'trường', 'tuấn', 'tùng', 'việt', 'vũ', 'vương', 'huy',
    'đăng', 'phúc', 'lâm', 'đình', 'thắng', 'quốc', 'tín', 'hiếu', 'tiến',
    'công', 'danh', 'đan', 'hào', 'khang', 'kỳ', 'lợi', 'luân', 'nguyên',
    'nhật', 'ninh', 'phát', 'tâm', 'thịnh', 'thuận', 'triều', 'trọng', 'tú',

    // ===== THAI MALE (40+) =====
    'phon', 'chai', 'somchai', 'pong', 'boy', 'nut', 'tong', 'bank', 'film',
    'win', 'bright', 'gun', 'new', 'mark', 'james', 'mike', 'off', 'arm',
    'earth', 'mix', 'pond', 'plan', 'mean', 'peak', 'pop', 'top', 'ton',
    'benz', 'boss', 'big', 'first', 'fluke', 'ford', 'gulf', 'krist',
    'lee', 'mew', 'nat', 'ohm', 'pat', 'sing', 'tay',

    // ===== HINDI/INDIAN MALE (80+) =====
    'aamir', 'abhishek', 'ajay', 'akshay', 'amir', 'amitabh', 'anil',
    'arjun', 'ashok', 'bahadur', 'bharat', 'chandra', 'deepak', 'dev',
    'dharmendra', 'dilip', 'dinesh', 'ganesh', 'gautam', 'govind', 'hari',
    'hrithik', 'irrfan', 'jagdish', 'kapil', 'karan', 'kishore', 'krishna',
    'kumar', 'manoj', 'mohan', 'mukesh', 'nana', 'narendra', 'nawazuddin',
    'nikhil', 'pankaj', 'prabhas', 'prakash', 'rajesh', 'rajkumar', 'rajan',
    'rakesh', 'ram', 'ranveer', 'ravi', 'rohit', 'sachin', 'salman',
    'sanjay', 'shah', 'shahrukh', 'shashi', 'sunil', 'suresh', 'varun',
    'vijay', 'vikram', 'vinod', 'vishal', 'vivek', 'yash',

    // ===== ARABIC MALE (40+) =====
    'abdul', 'abdullah', 'ahmad', 'ahmed', 'ali', 'amin', 'amir',
    'bilal', 'farid', 'hamza', 'hasan', 'hassan', 'hussain', 'ibrahim',
    'ismail', 'karim', 'khalid', 'mahmoud', 'malik', 'mansour', 'marwan',
    'mehdi', 'mohammed', 'muhammad', 'murad', 'nabil', 'nasser', 'omar',
    'othman', 'rashid', 'riad', 'saeed', 'said', 'salim', 'sharif',
    'sultan', 'tariq', 'walid', 'youssef', 'yusuf', 'ziad',

    // ===== ITALIAN MALE (40+) =====
    'adriano', 'alberto', 'aldo', 'alessandro', 'alfredo', 'andrea', 'angelo',
    'antonino', 'antonio', 'carlo', 'claudio', 'daniele', 'davide', 'domenico',
    'emanuele', 'enrico', 'enzo', 'fabio', 'federico', 'filippo', 'franco',
    'giacomo', 'giancarlo', 'giorgio', 'giovanni', 'giuseppe', 'guido',
    'luca', 'luigi', 'marcello', 'marco', 'mario', 'massimo', 'matteo',
    'maurizio', 'mauro', 'nicola', 'paolo', 'pietro', 'raffaele', 'riccardo',
    'roberto', 'rocco', 'salvatore', 'sandro', 'simone', 'stefano', 'vincenzo',
    'vittorio',

    // ===== POLISH MALE (20+) =====
    'adam', 'andrzej', 'bartosz', 'damian', 'dawid', 'grzegorz', 'hubert',
    'jakub', 'jan', 'jerzy', 'kamil', 'krzysztof', 'lukasz', 'maciej',
    'marcin', 'marek', 'mariusz', 'michal', 'pawel', 'piotr', 'rafal',
    'robert', 'slawomir', 'stanislaw', 'tomasz', 'wojciech', 'zbigniew',

    // ===== TURKISH MALE (20+) =====
    'ahmet', 'ali', 'cem', 'emre', 'erdogan', 'halil', 'hakan',
    'husnu', 'ismail', 'kemal', 'mehmet', 'murat', 'mustafa', 'oguz',
    'omer', 'orhan', 'osman', 'recep', 'selim', 'sinan', 'suleyman',
    'tarik', 'tolga', 'umut', 'volkan', 'yilmaz',
]);

// Well-known celebrities (full name → gender)
const KNOWN_CELEBRITIES = {
    // ===== FEMALE CELEBRITIES =====
    'scarlett johansson': 'Female', 'angelina jolie': 'Female', 'jennifer lawrence': 'Female',
    'emma watson': 'Female', 'emma stone': 'Female', 'natalie portman': 'Female',
    'cate blanchett': 'Female', 'meryl streep': 'Female', 'gal gadot': 'Female',
    'margot robbie': 'Female', 'anne hathaway': 'Female', 'sandra bullock': 'Female',
    'nicole kidman': 'Female', 'charlize theron': 'Female', 'zendaya': 'Female',
    'florence pugh': 'Female', 'ana de armas': 'Female', 'sydney sweeney': 'Female',
    'jenna ortega': 'Female', 'millie bobby brown': 'Female', 'anya taylor-joy': 'Female',
    'brie larson': 'Female', 'elizabeth olsen': 'Female', 'hailee steinfeld': 'Female',
    'emily blunt': 'Female', 'viola davis': 'Female', 'amy adams': 'Female',
    'zoe saldana': 'Female', 'keira knightley': 'Female', 'alicia vikander': 'Female',
    'gong li': 'Female', 'fan bingbing': 'Female', 'liu yifei': 'Female',
    'yang mi': 'Female', 'zhao liying': 'Female', 'tang wei': 'Female', 'zhou dongyu': 'Female',
    'song hye-kyo': 'Female', 'jun ji-hyun': 'Female', 'bae suzy': 'Female',
    'park shin-hye': 'Female', 'iu': 'Female', 'kim go-eun': 'Female', 'han so-hee': 'Female',
    'kim ji-won': 'Female', 'shin hye-sun': 'Female', 'kim yoo-jung': 'Female',
    'haruka ayase': 'Female', 'satomi ishihara': 'Female', 'yui aragaki': 'Female',
    'suzu hirose': 'Female', 'kanna hashimoto': 'Female', 'nana komatsu': 'Female',
    'ninh dương lan ngọc': 'Female', 'ngô thanh vân': 'Female', 'nhã phương': 'Female',
    'chi pu': 'Female', 'tăng thanh hà': 'Female', 'hoàng thùy linh': 'Female',
    'greta gerwig': 'Female', 'patty jenkins': 'Female', 'chloe zhao': 'Female',
    'sofia coppola': 'Female', 'kathryn bigelow': 'Female', 'ava duvernay': 'Female',
    'jessica alba': 'Female', 'megan fox': 'Female', 'drew barrymore': 'Female',
    'cameron diaz': 'Female', 'uma thurman': 'Female', 'kate winslet': 'Female',
    'penelope cruz': 'Female', 'salma hayek': 'Female', 'halle berry': 'Female',
    'jodie foster': 'Female', 'sigourney weaver': 'Female', 'rachel mcadams': 'Female',
    'reese witherspoon': 'Female', 'jennifer aniston': 'Female', 'kristen stewart': 'Female',
    'gwyneth paltrow': 'Female', 'sienna miller': 'Female', 'carey mulligan': 'Female',
    'rooney mara': 'Female', 'felicity jones': 'Female', 'daisy ridley': 'Female',
    'tessa thompson': 'Female', 'karen gillan': 'Female', 'gemma chan': 'Female',
    'awkwafina': 'Female', 'rachel weisz': 'Female', 'tilda swinton': 'Female',
    'helena bonham carter': 'Female', 'emma thompson': 'Female', 'naomi watts': 'Female',
    'mila kunis': 'Female', 'kate beckinsale': 'Female', 'jennifer connelly': 'Female',
    'octavia spencer': 'Female', 'saoirse ronan': 'Female', 'lupita nyongo': 'Female',
    'milly alcock': 'Female', "emma d'arcy": 'Female', 'olivia cooke': 'Female',
    'jing tian': 'Female', 'kim tae-hee': 'Female', 'han hyo-joo': 'Female',
    'jeon yeo-been': 'Female', 'moon ga-young': 'Female',
    'kasumi arimura': 'Female', 'nanase nishino': 'Female', 'mai shiraishi': 'Female',
    'aya ueto': 'Female', 'diễm my 9x': 'Female', 'ngọc trinh': 'Female', 'midu': 'Female',
    'trương ngọc ánh': 'Female', 'deepika padukone': 'Female', 'priyanka chopra': 'Female',
    'aishwarya rai': 'Female', 'kareena kapoor': 'Female', 'alia bhatt': 'Female',
    'kangana ranaut': 'Female', 'vidya balan': 'Female',

    // ===== MALE CELEBRITIES =====
    'tom cruise': 'Male', 'brad pitt': 'Male', 'leonardo dicaprio': 'Male',
    'johnny depp': 'Male', 'robert downey jr': 'Male', 'robert downey jr.': 'Male',
    'chris evans': 'Male', 'chris hemsworth': 'Male', 'chris pratt': 'Male',
    'ryan reynolds': 'Male', 'ryan gosling': 'Male', 'keanu reeves': 'Male',
    'will smith': 'Male', 'morgan freeman': 'Male', 'denzel washington': 'Male',
    'dwayne johnson': 'Male', 'vin diesel': 'Male', 'jason statham': 'Male',
    'tom hanks': 'Male', 'tom hardy': 'Male', 'tom holland': 'Male',
    'benedict cumberbatch': 'Male', 'robert pattinson': 'Male', 'pedro pascal': 'Male',
    'oscar isaac': 'Male', 'adam driver': 'Male', 'joaquin phoenix': 'Male',
    'christian bale': 'Male', 'matt damon': 'Male', 'ben affleck': 'Male',
    'cillian murphy': 'Male', 'robert de niro': 'Male', 'al pacino': 'Male',
    'anthony hopkins': 'Male', 'liam neeson': 'Male', 'hugh jackman': 'Male',
    'henry cavill': 'Male', 'jason momoa': 'Male', 'gary oldman': 'Male',
    'ralph fiennes': 'Male', 'kit harington': 'Male', 'peter dinklage': 'Male',
    'jackie chan': 'Male', 'jet li': 'Male', 'donnie yen': 'Male',
    'tony leung': 'Male', 'andy lau': 'Male', 'stephen chow': 'Male',
    'bruce lee': 'Male', 'chow yun-fat': 'Male', 'ken watanabe': 'Male',
    'hayao miyazaki': 'Male', 'makoto shinkai': 'Male', 'hideaki anno': 'Male',
    'takuya kimura': 'Male', 'masaki suda': 'Male', 'takeru satoh': 'Male',
    'kento yamazaki': 'Male', 'shun oguri': 'Male', 'ryunosuke kamiki': 'Male',
    'lee min-ho': 'Male', 'hyun bin': 'Male', 'song joong-ki': 'Male',
    'gong yoo': 'Male', 'kim soo-hyun': 'Male', 'park seo-joon': 'Male',
    'bong joon-ho': 'Male', 'park chan-wook': 'Male', 'lee jong-suk': 'Male',
    'ji chang-wook': 'Male', 'nam joo-hyuk': 'Male', 'ahn hyo-seop': 'Male',
    'lee do-hyun': 'Male', 'park bo-gum': 'Male', 'lee seung-gi': 'Male',
    'so ji-sub': 'Male', 'jo in-sung': 'Male', 'won bin': 'Male',
    'trấn thành': 'Male', 'trường giang': 'Male', 'hoài linh': 'Male',
    'thái hòa': 'Male', 'lý hải': 'Male', 'victor vũ': 'Male',
    'charlie nguyễn': 'Male', 'kiều minh tuấn': 'Male', 'hứa vĩ văn': 'Male',
    'steven spielberg': 'Male', 'martin scorsese': 'Male', 'christopher nolan': 'Male',
    'james cameron': 'Male', 'quentin tarantino': 'Male', 'ridley scott': 'Male',
    'denis villeneuve': 'Male', 'david fincher': 'Male', 'peter jackson': 'Male',
    'guillermo del toro': 'Male', 'ang lee': 'Male', 'wong kar-wai': 'Male',
    'zhang yimou': 'Male', 'chen kaige': 'Male', 'stanley kubrick': 'Male',
    'alfred hitchcock': 'Male', 'francis ford coppola': 'Male', 'george lucas': 'Male',
    'clint eastwood': 'Male', 'spike lee': 'Male', 'woody allen': 'Male',
    'ron howard': 'Male', 'michael bay': 'Male', 'zack snyder': 'Male',
    'j.j. abrams': 'Male', 'jj abrams': 'Male', 'joel coen': 'Male', 'ethan coen': 'Male',
    'samuel l. jackson': 'Male', 'samuel l jackson': 'Male',
    'tobey maguire': 'Male', 'andrew garfield': 'Male', 'timothee chalamet': 'Male',
    'austin butler': 'Male', 'paul mescal': 'Male', 'barry keoghan': 'Male',
    'jack nicholson': 'Male', 'ian mckellen': 'Male', 'patrick stewart': 'Male',
    'russell crowe': 'Male', 'daniel craig': 'Male', 'idris elba': 'Male',
    'michael b. jordan': 'Male', 'michael b jordan': 'Male',
    'chadwick boseman': 'Male', 'ezra miller': 'Male', 'simu liu': 'Male',
    'tony leung chiu-wai': 'Male', 'nikolaj coster-waldau': 'Male',
    'josh brolin': 'Male', 'john cena': 'Male', 'dave bautista': 'Male',
    'ben kingsley': 'Male', 'colin firth': 'Male', 'alan rickman': 'Male',
    'eddie redmayne': 'Male', 'jake gyllenhaal': 'Male', 'mark ruffalo': 'Male',
    'jeremy renner': 'Male', 'orlando bloom': 'Male',
    'mamoru hosoda': 'Male', 'isao takahata': 'Male', 'satoshi kon': 'Male',
    'mamoru oshii': 'Male', 'katsuhiro otomo': 'Male', 'takeshi kitano': 'Male',
    'eiichiro oda': 'Male', 'masashi kishimoto': 'Male', 'akira toriyama': 'Male',
    'hajime isayama': 'Male', 'shah rukh khan': 'Male', 'salman khan': 'Male',
    'aamir khan': 'Male', 'amitabh bachchan': 'Male', 'hrithik roshan': 'Male',
    'ranveer singh': 'Male', 'ranbir kapoor': 'Male', 'varun dhawan': 'Male',

    // ===== OTHER / GROUP =====
    'the wachowskis': 'Other', 'coen brothers': 'Other', 'one': 'Other',
    'wachowski brothers': 'Other',
};

/**
 * Detect gender based on name.
 * @param {string} name - Full name of the person
 * @returns {'Male' | 'Female' | 'Other'}
 */
export function detectGender(name) {
    if (!name || typeof name !== 'string') return 'Other';

    const lowerName = name.toLowerCase().trim();
    if (!lowerName) return 'Other';

    // 1. Check known celebrities (exact match)
    if (KNOWN_CELEBRITIES[lowerName]) return KNOWN_CELEBRITIES[lowerName];

    // 2. Check known celebrities (partial/fuzzy match)
    for (const [celeb, gender] of Object.entries(KNOWN_CELEBRITIES)) {
        if (lowerName.includes(celeb) || celeb.includes(lowerName)) return gender;
    }

    // 3. Extract first name and check against name databases
    const parts = lowerName.split(/[\s-]+/).filter(p => p.length > 0);
    if (parts.length === 0) return 'Other';

    const firstName = parts[0];

    if (FEMALE_FIRST_NAMES.has(firstName)) return 'Female';
    if (MALE_FIRST_NAMES.has(firstName)) return 'Male';

    // 4. For Vietnamese names, check the last part (given name)
    if (parts.length > 1) {
        const lastName = parts[parts.length - 1];
        const hasDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(lowerName);
        if (hasDiacritics) {
            if (FEMALE_FIRST_NAMES.has(lastName)) return 'Female';
            if (MALE_FIRST_NAMES.has(lastName)) return 'Male';
        }
    }

    // 5. Japanese name pattern: names ending in -ko, -mi, -e are often female
    if (/[a-z]/.test(firstName)) {
        if (firstName.endsWith('ko') && firstName.length > 3) return 'Female';
        if (firstName.endsWith('mi') && firstName.length > 3 && !MALE_FIRST_NAMES.has(firstName)) return 'Female';
    }

    // 6. Cannot determine → Other
    return 'Other';
}
