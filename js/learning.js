// ==========================================
// DUOLINGO-STYLE LEARNING - Wetherby Year 2
// ==========================================

const LearningApp = (() => {
    let progress = { xp: 0, streak: 0, hearts: 5, completed: {}, scores: {} };
    let currentSubject = null;
    let currentLesson = null;
    let currentQuestionIndex = 0;
    let currentQuestions = [];
    let sessionCorrect = 0;
    let sessionTotal = 0;
    let answered = false;

    const subjects = {
        maths: {
            name: 'Maths', icon: '🔢', color: '#4CAF50',
            lessons: [
                { id: 'maths-1', title: 'Place Value', description: 'Numbers up to 1000', questions: [
                    { type: 'multiple', q: 'What is the value of the 3 in 356?', options: ['3','30','300','3000'], answer: 2 },
                    { type: 'multiple', q: 'Which number is three hundred and forty-two?', options: ['243','342','432','324'], answer: 1 },
                    { type: 'multiple', q: 'What comes after 499?', options: ['500','498','409','599'], answer: 0 },
                    { type: 'multiple', q: 'How many tens are in 270?', options: ['2','7','27','70'], answer: 2 },
                    { type: 'multiple', q: 'Which is the biggest number?', options: ['289','298','982','928'], answer: 2 },
                    { type: 'multiple', q: 'What is 400 + 50 + 6?', options: ['456','465','546','654'], answer: 0 },
                    { type: 'trueFalse', q: '150 is greater than 105', answer: true },
                    { type: 'multiple', q: 'What digit is in the hundreds place of 847?', options: ['8','4','7','84'], answer: 0 },
                ]},
                { id: 'maths-2', title: 'Addition & Subtraction', description: 'Adding and subtracting within 1000', questions: [
                    { type: 'multiple', q: '345 + 123 = ?', options: ['468','458','478','448'], answer: 0 },
                    { type: 'multiple', q: '500 - 175 = ?', options: ['335','325','315','375'], answer: 1 },
                    { type: 'multiple', q: '67 + 48 = ?', options: ['105','115','125','95'], answer: 1 },
                    { type: 'multiple', q: '200 - 86 = ?', options: ['124','114','134','104'], answer: 1 },
                    { type: 'multiple', q: 'What is 99 + 99?', options: ['188','198','208','189'], answer: 1 },
                    { type: 'trueFalse', q: '250 + 250 = 500', answer: true },
                    { type: 'multiple', q: '1000 - 1 = ?', options: ['999','99','990','909'], answer: 0 },
                    { type: 'multiple', q: '456 + 44 = ?', options: ['490','500','510','496'], answer: 1 },
                ]},
                { id: 'maths-3', title: 'Multiplication & Division', description: '2, 5 and 10 times tables', questions: [
                    { type: 'multiple', q: '5 x 7 = ?', options: ['25','30','35','40'], answer: 2 },
                    { type: 'multiple', q: '2 x 9 = ?', options: ['16','18','20','14'], answer: 1 },
                    { type: 'multiple', q: '10 x 6 = ?', options: ['16','60','66','106'], answer: 1 },
                    { type: 'multiple', q: '20 / 5 = ?', options: ['3','4','5','6'], answer: 1 },
                    { type: 'multiple', q: '30 / 10 = ?', options: ['2','3','4','5'], answer: 1 },
                    { type: 'trueFalse', q: '5 x 5 = 25', answer: true },
                    { type: 'multiple', q: '2 x 12 = ?', options: ['22','24','26','28'], answer: 1 },
                    { type: 'multiple', q: 'What is 10 x 10?', options: ['100','110','1000','20'], answer: 0 },
                ]},
                { id: 'maths-4', title: 'Fractions', description: 'Halves, thirds, and quarters', questions: [
                    { type: 'multiple', q: 'What is 1/2 of 10?', options: ['2','4','5','6'], answer: 2 },
                    { type: 'multiple', q: 'What is 1/4 of 20?', options: ['4','5','10','15'], answer: 1 },
                    { type: 'multiple', q: 'What is 1/3 of 12?', options: ['3','4','6','2'], answer: 1 },
                    { type: 'trueFalse', q: '1/2 is the same as 2/4', answer: true },
                    { type: 'multiple', q: 'What is 3/4 of 8?', options: ['4','5','6','7'], answer: 2 },
                    { type: 'multiple', q: 'Which fraction is biggest?', options: ['1/4','1/3','1/2','1/5'], answer: 2 },
                    { type: 'trueFalse', q: '1/3 of 9 is 3', answer: true },
                    { type: 'multiple', q: 'What is 1/2 of 50?', options: ['20','25','30','35'], answer: 1 },
                ]},
                { id: 'maths-5', title: 'Time', description: 'Telling the time & durations', questions: [
                    { type: 'multiple', q: 'How many minutes in 1 hour?', options: ['30','60','100','45'], answer: 1 },
                    { type: 'multiple', q: 'What time is quarter past 3?', options: ['3:30','3:15','3:45','2:15'], answer: 1 },
                    { type: 'multiple', q: 'How many hours in a day?', options: ['12','20','24','48'], answer: 2 },
                    { type: 'multiple', q: 'What is 30 minutes after 2:15?', options: ['2:45','2:30','3:15','3:45'], answer: 0 },
                    { type: 'trueFalse', q: 'Half past 6 is 6:30', answer: true },
                    { type: 'multiple', q: 'How many days in a week?', options: ['5','6','7','10'], answer: 2 },
                    { type: 'multiple', q: 'What is quarter to 5?', options: ['4:15','5:15','4:45','5:45'], answer: 2 },
                    { type: 'trueFalse', q: 'There are 60 seconds in a minute', answer: true },
                ]},
                { id: 'maths-6', title: 'Measurement', description: 'Length, mass and capacity', questions: [
                    { type: 'multiple', q: 'How many cm in 1 metre?', options: ['10','50','100','1000'], answer: 2 },
                    { type: 'multiple', q: 'Which unit for a swimming pool?', options: ['cm','metres','mm','grams'], answer: 1 },
                    { type: 'multiple', q: 'How many grams in 1 kg?', options: ['10','100','1000','10000'], answer: 2 },
                    { type: 'trueFalse', q: 'A litre is more than a millilitre', answer: true },
                    { type: 'multiple', q: 'Which is heavier: 1 kg or 500 g?', options: ['1 kg','500 g','Same','Cannot tell'], answer: 0 },
                    { type: 'multiple', q: 'How many ml in 1 litre?', options: ['10','100','1000','500'], answer: 2 },
                    { type: 'multiple', q: 'A pencil is about how long?', options: ['15 cm','15 m','15 mm','15 km'], answer: 0 },
                    { type: 'trueFalse', q: 'Kilometres measure long distances', answer: true },
                ]},
                { id: 'maths-7', title: 'Shape & Position', description: '2D and 3D shapes, turns', questions: [
                    { type: 'multiple', q: 'How many sides does a hexagon have?', options: ['5','6','7','8'], answer: 1 },
                    { type: 'multiple', q: 'How many faces does a cube have?', options: ['4','6','8','12'], answer: 1 },
                    { type: 'multiple', q: 'A quarter turn is also called?', options: ['Right angle','180 degrees','Full turn','Half turn'], answer: 0 },
                    { type: 'trueFalse', q: 'A triangle has 3 vertices', answer: true },
                    { type: 'multiple', q: 'Which shape has no straight edges?', options: ['Square','Triangle','Circle','Rectangle'], answer: 2 },
                    { type: 'multiple', q: 'How many edges does a cuboid have?', options: ['6','8','12','10'], answer: 2 },
                    { type: 'trueFalse', q: 'A pentagon has 5 sides', answer: true },
                    { type: 'multiple', q: 'A half turn is how many degrees?', options: ['90','180','270','360'], answer: 1 },
                ]},
                { id: 'maths-8', title: 'Statistics', description: 'Tally charts, tables and graphs', questions: [
                    { type: 'multiple', q: 'In a tally chart, how is 5 shown?', options: ['|||||','|||| with line through','V','5'], answer: 1 },
                    { type: 'multiple', q: '3 like apples, 5 like bananas. Total?', options: ['2','5','8','15'], answer: 2 },
                    { type: 'trueFalse', q: 'A pictogram uses pictures to show data', answer: true },
                    { type: 'multiple', q: 'Tallest bar in bar chart shows...', options: ['smallest','largest','middle','total'], answer: 1 },
                    { type: 'multiple', q: 'Red:4, Blue:7, Green:3. Most popular?', options: ['Red','Blue','Green','Cannot tell'], answer: 1 },
                    { type: 'multiple', q: 'Red:4, Blue:7, Green:3. How many more blue than green?', options: ['3','4','5','7'], answer: 1 },
                    { type: 'trueFalse', q: 'Tables organise information', answer: true },
                    { type: 'multiple', q: 'Each picture = 2 people. 3 pictures means...', options: ['3','5','6','8'], answer: 2 },
                ]},
            ]
        },
        english: {
            name: 'English', icon: '📖', color: '#2196F3',
            lessons: [
                { id: 'eng-1', title: 'Punctuation', description: 'Full stops, commas, question marks', questions: [
                    { type: 'multiple', q: 'Which sentence is punctuated correctly?', options: ['the cat sat on the mat','The cat sat on the mat.','the Cat sat on the Mat','The cat sat on the mat'], answer: 1 },
                    { type: 'multiple', q: 'What goes at end of "Where are you going"?', options: ['.','!','?',','], answer: 2 },
                    { type: 'trueFalse', q: 'Every sentence should start with a capital letter', answer: true },
                    { type: 'multiple', q: 'Which needs an exclamation mark?', options: ['I like cake','Watch out','Where is he','The sky is blue'], answer: 1 },
                    { type: 'multiple', q: 'Commas are used to...', options: ['end sentences','separate items in a list','start sentences','join paragraphs'], answer: 1 },
                    { type: 'trueFalse', q: '"I can\'t wait!" uses an exclamation mark correctly', answer: true },
                    { type: 'multiple', q: 'Which word should always have a capital letter?', options: ['dog','london','happy','running'], answer: 1 },
                    { type: 'multiple', q: 'Add punctuation: "What a lovely day__"', options: ['.','?','!',','], answer: 2 },
                ]},
                { id: 'eng-2', title: 'Apostrophes', description: 'Contractions and possession', questions: [
                    { type: 'multiple', q: '"Can not" becomes...', options: ["can't","cann't","cannot'","ca'nt"], answer: 0 },
                    { type: 'multiple', q: '"The dog\'s bone" means...', options: ['The dogs like bones','The bone belongs to the dog','The dogs are bony','More than one dog'], answer: 1 },
                    { type: 'multiple', q: '"I am" becomes...', options: ["I'm",'Im',"I'am",'Iam'], answer: 0 },
                    { type: 'trueFalse', q: '"It\'s" means "it is"', answer: true },
                    { type: 'multiple', q: 'Which is correct?', options: ['The girls bag',"The girl's bag","The girls' bag","The girle's bag"], answer: 1 },
                    { type: 'multiple', q: '"We are" becomes...', options: ['Were',"We're",'Wear',"We'ar"], answer: 1 },
                    { type: 'multiple', q: '"Did not" becomes...', options: ["did'nt","didn't","didnt'","didn'ot"], answer: 1 },
                    { type: 'trueFalse', q: 'Apostrophes show letters are missing', answer: true },
                ]},
                { id: 'eng-3', title: 'Tenses', description: 'Past, present and future', questions: [
                    { type: 'multiple', q: 'Which is past tense?', options: ['I walk','I walked','I will walk','I am walking'], answer: 1 },
                    { type: 'multiple', q: 'Change to past: "I jump"', options: ['I jumping','I jumped','I will jump','I jumps'], answer: 1 },
                    { type: 'multiple', q: 'Which shows something happening now?', options: ['ran','will run','is running','run'], answer: 2 },
                    { type: 'trueFalse', q: '"She will play tomorrow" is future tense', answer: true },
                    { type: 'multiple', q: 'Past tense of "go"?', options: ['goed','went','gone','going'], answer: 1 },
                    { type: 'multiple', q: 'Past tense of "eat"?', options: ['eated','eaten','ate','eating'], answer: 2 },
                    { type: 'multiple', q: '"The birds are singing" - what tense?', options: ['Past','Present','Future','None'], answer: 1 },
                    { type: 'trueFalse', q: '"Yesterday I played football" is past tense', answer: true },
                ]},
                { id: 'eng-4', title: 'Conjunctions', description: 'Joining words: and, but, because, if', questions: [
                    { type: 'multiple', q: '"I was tired ___ I went to bed"', options: ['but','so','because','and'], answer: 1 },
                    { type: 'multiple', q: '"I like football ___ I don\'t like rugby"', options: ['and','but','because','so'], answer: 1 },
                    { type: 'multiple', q: '"I took an umbrella ___ it was raining"', options: ['but','and','because','or'], answer: 2 },
                    { type: 'trueFalse', q: '"And" is a conjunction', answer: true },
                    { type: 'multiple', q: 'Which uses "when" correctly?', options: ['When I grow up I want to be a pilot.','I when to the shops.','When is my word.','The when is here.'], answer: 0 },
                    { type: 'multiple', q: '"Do you want tea ___ coffee?"', options: ['and','but','or','because'], answer: 2 },
                    { type: 'multiple', q: '"___ you work hard, you will do well."', options: ['But','Or','If','And'], answer: 2 },
                    { type: 'trueFalse', q: 'Conjunctions join two ideas together', answer: true },
                ]},
                { id: 'eng-5', title: 'Adjectives & Adverbs', description: 'Describing words', questions: [
                    { type: 'multiple', q: 'Which is an adjective?', options: ['quickly','beautiful','running','happily'], answer: 1 },
                    { type: 'multiple', q: 'Which is an adverb?', options: ['tall','slowly','happy','blue'], answer: 1 },
                    { type: 'multiple', q: '"The ___ dog ran across the park."', options: ['quickly','big','bark','happily'], answer: 1 },
                    { type: 'trueFalse', q: 'Adjectives describe nouns', answer: true },
                    { type: 'multiple', q: '"She sang ___." Choose adverb.', options: ['beautiful','loud','beautifully','song'], answer: 2 },
                    { type: 'multiple', q: 'Find adjective: "The enormous elephant ate peanuts."', options: ['ate','elephant','peanuts','enormous'], answer: 3 },
                    { type: 'trueFalse', q: 'Adverbs often end in -ly', answer: true },
                    { type: 'multiple', q: 'Which adverb means "in a fast way"?', options: ['fast','quick','quickly','speedy'], answer: 2 },
                ]},
                { id: 'eng-6', title: 'Suffixes', description: 'Word endings: -ness, -ful, -less, -ly', questions: [
                    { type: 'multiple', q: 'Add suffix to "happy" to make noun', options: ['happyly','happiness','happiful','happier'], answer: 1 },
                    { type: 'multiple', q: '"Care" + "-ful" = ?', options: ['Carful','Careful','Careless','Carefully'], answer: 1 },
                    { type: 'multiple', q: 'What does "-less" mean?', options: ['Full of','Without','More','Very'], answer: 1 },
                    { type: 'trueFalse', q: '"Enjoyment" has the suffix -ment', answer: true },
                    { type: 'multiple', q: '"Kind" + "-ness" = ?', options: ['Kindly','Kindness','Kinder','Kindful'], answer: 1 },
                    { type: 'multiple', q: '"Hope" + "-less" = ?', options: ['Hopeful','Hoping','Hopeless','Hopefully'], answer: 2 },
                    { type: 'multiple', q: 'What suffix turns "slow" into adverb?', options: ['-ness','-ful','-ly','-ment'], answer: 2 },
                    { type: 'trueFalse', q: '"Thankful" means full of thanks', answer: true },
                ]},
            ]
        },
        science: {
            name: 'Science', icon: '🔬', color: '#9C27B0',
            lessons: [
                { id: 'sci-1', title: 'Living Things', description: 'Animals, habitats and life cycles', questions: [
                    { type: 'multiple', q: 'Which is a living thing?', options: ['Rock','Tree','Water','Cloud'], answer: 1 },
                    { type: 'multiple', q: 'What do all living things need?', options: ['Television','Food and water','Toys','Books'], answer: 1 },
                    { type: 'trueFalse', q: 'A habitat is where an animal lives', answer: true },
                    { type: 'multiple', q: 'Which is NOT a life process?', options: ['Growing','Breathing','Sleeping','Reproducing'], answer: 2 },
                    { type: 'multiple', q: 'A caterpillar turns into a...', options: ['Bird','Butterfly','Spider','Worm'], answer: 1 },
                    { type: 'multiple', q: 'Which animal lives in a pond?', options: ['Lion','Eagle','Frog','Camel'], answer: 2 },
                    { type: 'trueFalse', q: 'Seeds grow into new plants', answer: true },
                    { type: 'multiple', q: 'Frog life cycle starts as...', options: ['A tadpole','Frogspawn (eggs)','A froglet','A baby frog'], answer: 1 },
                ]},
                { id: 'sci-2', title: 'Classification', description: 'Sorting living things into groups', questions: [
                    { type: 'multiple', q: 'Which group do snakes belong to?', options: ['Mammals','Reptiles','Amphibians','Fish'], answer: 1 },
                    { type: 'multiple', q: 'What makes a mammal special?', options: ['Lays eggs','Has scales','Feeds babies milk','Lives in water'], answer: 2 },
                    { type: 'trueFalse', q: 'A spider is an insect', answer: false },
                    { type: 'multiple', q: 'How many legs do insects have?', options: ['4','6','8','10'], answer: 1 },
                    { type: 'multiple', q: 'Which is an invertebrate?', options: ['Dog','Fish','Snail','Bird'], answer: 2 },
                    { type: 'multiple', q: 'Amphibians can live...', options: ['Only in water','Only on land','On land and in water','Only in trees'], answer: 2 },
                    { type: 'trueFalse', q: 'Fish breathe through gills', answer: true },
                    { type: 'multiple', q: 'Which is a bird?', options: ['Bat','Penguin','Butterfly','Flying fish'], answer: 1 },
                ]},
                { id: 'sci-3', title: 'Plants', description: 'Parts of plants and what they need', questions: [
                    { type: 'multiple', q: 'What do plants need to grow?', options: ['Sunlight, water and soil','Just water','Only sunshine','Darkness'], answer: 0 },
                    { type: 'multiple', q: 'Which part takes in water?', options: ['Leaf','Flower','Root','Stem'], answer: 2 },
                    { type: 'multiple', q: 'What does the stem do?', options: ['Makes food','Carries water up','Attracts bees','Stores seeds'], answer: 1 },
                    { type: 'trueFalse', q: 'Flowers help plants make seeds', answer: true },
                    { type: 'multiple', q: 'What do leaves use to make food?', options: ['Water only','Sunlight','Soil','Wind'], answer: 1 },
                    { type: 'multiple', q: 'Seeds are spread by...', options: ['Wind, animals, water','Only rain','Only birds','Gravity only'], answer: 0 },
                    { type: 'trueFalse', q: 'A bulb can grow into a new plant', answer: true },
                    { type: 'multiple', q: 'What is germination?', options: ['When a flower dies','When a seed starts to grow','When leaves fall','When fruit ripens'], answer: 1 },
                ]},
                { id: 'sci-4', title: 'Materials', description: 'Properties and uses of materials', questions: [
                    { type: 'multiple', q: 'Which material is transparent?', options: ['Wood','Metal','Glass','Cardboard'], answer: 2 },
                    { type: 'multiple', q: 'Which is a natural material?', options: ['Plastic','Nylon','Wool','Polyester'], answer: 2 },
                    { type: 'trueFalse', q: 'Metal is a good conductor of heat', answer: true },
                    { type: 'multiple', q: 'Why are windows made of glass?', options: ['Strong','See through it','Cheap','Soft'], answer: 1 },
                    { type: 'multiple', q: 'Which material is waterproof?', options: ['Paper','Fabric','Rubber','Cardboard'], answer: 2 },
                    { type: 'multiple', q: 'Which can be bent easily?', options: ['Glass','Stone','Rubber','Brick'], answer: 2 },
                    { type: 'trueFalse', q: 'Wood comes from trees', answer: true },
                    { type: 'multiple', q: 'Which is man-made?', options: ['Cotton','Silk','Plastic','Leather'], answer: 2 },
                ]},
            ]
        },
        french: {
            name: 'French', icon: '🇫🇷', color: '#FF5722',
            lessons: [
                { id: 'fr-1', title: 'Les Sports', description: 'Sports vocabulary', questions: [
                    { type: 'multiple', q: 'How do you say "football" in French?', options: ['Le basket','Le football','Le tennis','Le rugby'], answer: 1 },
                    { type: 'multiple', q: '"Swimming" in French?', options: ['La natation','Le cyclisme','La danse','Le ski'], answer: 0 },
                    { type: 'multiple', q: '"Je joue au tennis" means...', options: ['I watch tennis','I like tennis','I play tennis','I hate tennis'], answer: 2 },
                    { type: 'trueFalse', q: '"Le rugby" is the same in French and English', answer: true },
                    { type: 'multiple', q: 'How do you say "I like"?', options: ['Je deteste',"J'aime",'Je joue','Je suis'], answer: 1 },
                    { type: 'multiple', q: '"Le basket" means...', options: ['A basket','Basketball','Baseball','Badminton'], answer: 1 },
                    { type: 'multiple', q: '"Le cyclisme" means...', options: ['Cycling','Swimming','Running','Skating'], answer: 0 },
                    { type: 'trueFalse', q: '"Je joue" means "I play"', answer: true },
                ]},
                { id: 'fr-2', title: 'Les Vetements', description: 'Clothing vocabulary', questions: [
                    { type: 'multiple', q: '"Un chapeau" is...', options: ['A coat','A hat','A shoe','A shirt'], answer: 1 },
                    { type: 'multiple', q: '"Shirt" in French?', options: ['Un pantalon','Une robe','Une chemise','Un manteau'], answer: 2 },
                    { type: 'multiple', q: '"Les chaussures" are...', options: ['Hats','Socks','Shoes','Gloves'], answer: 2 },
                    { type: 'trueFalse', q: '"Une robe" means "a dress"', answer: true },
                    { type: 'multiple', q: '"Un manteau" is...', options: ['A scarf','A hat','Trousers','A coat'], answer: 3 },
                    { type: 'multiple', q: 'How do you say "trousers"?', options: ['Un pantalon','Une jupe','Un pull','Une cravate'], answer: 0 },
                    { type: 'multiple', q: '"Je porte..." means...', options: ['I buy...','I wear...','I like...','I want...'], answer: 1 },
                    { type: 'trueFalse', q: '"Les chaussettes" means "socks"', answer: true },
                ]},
                { id: 'fr-3', title: 'Numbers & Colours', description: 'Nombres et couleurs', questions: [
                    { type: 'multiple', q: '"Seven" in French?', options: ['Six','Sept','Huit','Cinq'], answer: 1 },
                    { type: 'multiple', q: '"Rouge" means...', options: ['Blue','Green','Red','Yellow'], answer: 2 },
                    { type: 'multiple', q: '"Twenty" in French?', options: ['Douze','Quinze','Vingt','Trente'], answer: 2 },
                    { type: 'trueFalse', q: '"Bleu" means "blue"', answer: true },
                    { type: 'multiple', q: '"Vert" means...', options: ['Red','Blue','Yellow','Green'], answer: 3 },
                    { type: 'multiple', q: '"Fifteen" in French?', options: ['Treize','Quatorze','Quinze','Seize'], answer: 2 },
                    { type: 'multiple', q: '"Noir" means...', options: ['White','Black','Brown','Grey'], answer: 1 },
                    { type: 'trueFalse', q: '"Jaune" means "yellow"', answer: true },
                ]},
            ]
        }
    };

    function showLearningHub() { showScreen('learning-screen'); renderHub(); }

    function renderHub() {
        const grid = document.getElementById('learning-subjects');
        grid.innerHTML = '';
        updateXPDisplay();
        Object.entries(subjects).forEach(([key, subject]) => {
            const completedCount = subject.lessons.filter(l => progress.completed[l.id]).length;
            const totalLessons = subject.lessons.length;
            const pct = Math.round((completedCount / totalLessons) * 100);
            const card = document.createElement('div');
            card.className = 'learning-subject-card';
            card.style.borderColor = subject.color;
            card.onclick = () => showSubject(key);
            card.innerHTML = `<div class="subject-icon" style="background:${subject.color}">${subject.icon}</div><h3>${subject.name}</h3><div class="subject-progress-bar"><div class="subject-progress-fill" style="width:${pct}%;background:${subject.color}"></div></div><span class="subject-progress-text">${completedCount}/${totalLessons} lessons</span>`;
            grid.appendChild(card);
        });
    }

    function showSubject(key) {
        currentSubject = key;
        const subject = subjects[key];
        showScreen('learning-subject-screen');
        document.getElementById('subject-title').textContent = subject.name;
        document.getElementById('subject-title').style.color = subject.color;
        const list = document.getElementById('lesson-list');
        list.innerHTML = '';
        subject.lessons.forEach((lesson, idx) => {
            const done = progress.completed[lesson.id];
            const score = progress.scores[lesson.id];
            const locked = idx > 0 && !progress.completed[subject.lessons[idx - 1].id];
            const item = document.createElement('div');
            item.className = `lesson-item ${done ? 'done' : ''} ${locked ? 'locked' : ''}`;
            item.onclick = () => { if (!locked) startLesson(lesson); };
            item.innerHTML = `<div class="lesson-circle" style="border-color:${subject.color}">${done ? '\u2713' : locked ? '\ud83d\udd12' : idx + 1}</div><div class="lesson-info"><h4>${lesson.title}</h4><p>${lesson.description}</p>${score ? `<span class="lesson-score">${score.correct}/${score.total} correct</span>` : ''}</div>${done ? `<span class="lesson-badge" style="background:${subject.color}">+10 XP</span>` : ''}`;
            list.appendChild(item);
        });
    }

    function startLesson(lesson) {
        currentLesson = lesson; currentQuestionIndex = 0; sessionCorrect = 0; sessionTotal = 0; answered = false;
        currentQuestions = shuffleArray([...lesson.questions]).slice(0, 5);
        showScreen('learning-quiz-screen');
        document.getElementById('quiz-lesson-title').textContent = lesson.title;
        renderQuestion();
    }

    function renderQuestion() {
        answered = false;
        const q = currentQuestions[currentQuestionIndex];
        const container = document.getElementById('quiz-content');
        document.getElementById('quiz-progress-fill').style.width = `${((currentQuestionIndex) / currentQuestions.length) * 100}%`;
        document.getElementById('quiz-progress-text').textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length}`;
        document.getElementById('quiz-hearts').textContent = '\u2764\ufe0f'.repeat(Math.max(0, progress.hearts));
        if (q.type === 'multiple') {
            container.innerHTML = `<p class="quiz-question">${q.q}</p><div class="quiz-options">${q.options.map((opt, i) => `<button class="quiz-option" onclick="LearningApp.checkAnswer(${i})">${opt}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback"></div>`;
        } else {
            container.innerHTML = `<p class="quiz-question">${q.q}</p><div class="quiz-options tf-options"><button class="quiz-option tf-true" onclick="LearningApp.checkAnswer(true)">\u2713 True</button><button class="quiz-option tf-false" onclick="LearningApp.checkAnswer(false)">\u2717 False</button></div><div id="quiz-feedback" class="quiz-feedback"></div>`;
        }
    }

    function checkAnswer(selected) {
        if (answered) return;
        answered = true;
        const q = currentQuestions[currentQuestionIndex];
        const correct = selected === q.answer;
        sessionTotal++;
        const feedback = document.getElementById('quiz-feedback');
        const options = document.querySelectorAll('.quiz-option');
        if (correct) {
            sessionCorrect++; progress.xp += 2;
            feedback.innerHTML = '<span class="feedback-correct">\u2713 Correct! +2 XP</span>';
            if (q.type === 'multiple') { options[q.answer].classList.add('correct'); }
            else { options.forEach(o => { if ((q.answer === true && o.classList.contains('tf-true')) || (q.answer === false && o.classList.contains('tf-false'))) o.classList.add('correct'); }); }
        } else {
            progress.hearts = Math.max(0, progress.hearts - 1);
            feedback.innerHTML = '<span class="feedback-wrong">\u2717 Not quite!</span>';
            if (q.type === 'multiple') { options[selected].classList.add('wrong'); options[q.answer].classList.add('correct'); }
            else { options.forEach(o => { if ((selected === true && o.classList.contains('tf-true')) || (selected === false && o.classList.contains('tf-false'))) o.classList.add('wrong'); if ((q.answer === true && o.classList.contains('tf-true')) || (q.answer === false && o.classList.contains('tf-false'))) o.classList.add('correct'); }); }
        }
        options.forEach(o => o.disabled = true);
        feedback.innerHTML += `<button class="quiz-next-btn" onclick="LearningApp.nextQuestion()">Continue \u2192</button>`;
        updateXPDisplay();
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= currentQuestions.length) finishLesson();
        else renderQuestion();
    }

    function finishLesson() {
        const pct = Math.round((sessionCorrect / sessionTotal) * 100);
        const passed = pct >= 60;
        if (passed) { progress.completed[currentLesson.id] = true; progress.xp += 10; progress.streak++; progress.hearts = Math.min(5, progress.hearts + 1); }
        progress.scores[currentLesson.id] = { correct: sessionCorrect, total: sessionTotal };
        const container = document.getElementById('quiz-content');
        document.getElementById('quiz-progress-fill').style.width = '100%';
        container.innerHTML = `<div class="quiz-results"><div class="results-icon">${passed ? '\ud83c\udfc6' : '\ud83d\udcaa'}</div><h2>${passed ? 'Lesson Complete!' : 'Keep Practising!'}</h2><p class="results-score">${sessionCorrect} out of ${sessionTotal} correct (${pct}%)</p>${passed ? '<p class="results-xp">+10 XP bonus!</p>' : '<p class="results-retry">You need 60% to pass. Try again!</p>'}<div class="results-buttons">${!passed ? '<button class="btn-primary" onclick="LearningApp.retryLesson()">Try Again</button>' : ''}<button class="btn-secondary" onclick="LearningApp.backToSubject()">Back to ${subjects[currentSubject].name}</button><button class="btn-secondary" onclick="LearningApp.backToHub()">Learning Hub</button></div></div>`;
        updateXPDisplay();
    }

    function retryLesson() { progress.hearts = Math.min(5, progress.hearts + 2); startLesson(currentLesson); }
    function backToSubject() { showSubject(currentSubject); }
    function backToHub() { showScreen('learning-screen'); renderHub(); }
    function updateXPDisplay() {
        const el = document.getElementById('learning-xp'); if (el) el.textContent = `${progress.xp} XP`;
        const s = document.getElementById('learning-streak'); if (s) s.textContent = `\ud83d\udd25 ${progress.streak}`;
    }
    function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

    return { showLearningHub, showSubject, startLesson, checkAnswer, nextQuestion, retryLesson, backToSubject, backToHub };
})();
