// Everyday (non-holiday) words mixed into every holiday, split by difficulty.
// A holiday word with the same spelling wins, so duplicates here are harmless.
window.EVERYDAY = {
  songs: {
    easy: [
      "Happy Birthday", "Twinkle Twinkle Little Star", "Old MacDonald", "Baby Shark", "Let It Go", "Single Ladies",
      "Shake It Off", "Yellow Submarine", "YMCA", "Macarena", "Gangnam Style", "Happy", "Hello", "Call Me Maybe",
      "Firework", "Roar", "Wrecking Ball", "Baby", "We Are the Champions", "Stayin' Alive", "Dancing Queen",
      "Beat It", "Hound Dog", "Twist and Shout", "Here Comes the Sun", "Eye of the Tiger", "Umbrella", "Bye Bye Bye",
      "My Heart Will Go On", "Under the Sea", "Row, Row, Row Your Boat", "The Wheels on the Bus", "Jingle Bells",
      "Rudolph the Red-Nosed Reindeer", "Take Me Out to the Ball Game", "Hips Don't Lie", "Blinding Lights",
      "U Can't Touch This", "Cha Cha Slide", "Hokey Pokey", "Chicken Dance", "Stairway to Heaven", "Piano Man",
      "Rocket Man", "Tiny Dancer", "Fly Me to the Moon", "Counting Stars"
    ],
    hard: [
      "Bohemian Rhapsody", "Billie Jean", "Uptown Funk", "Hey Jude", "Imagine", "Rolling in the Deep",
      "Someone Like You", "Shape of You", "Bad Guy", "Old Town Road", "Despacito", "Party in the U.S.A.",
      "Sweet Caroline", "Don't Stop Believin'", "Livin' on a Prayer", "We Will Rock You", "I Will Survive",
      "Respect", "Material Girl", "Jailhouse Rock", "Johnny B. Goode", "Let It Be", "Wonderwall",
      "Sweet Child o' Mine", "Africa", "Take On Me", "Don't Stop Me Now", "Crazy in Love", "...Baby One More Time",
      "Oops!... I Did It Again", "Wannabe", "I Want It That Way", "I Will Always Love You",
      "Total Eclipse of the Heart", "Hakuna Matata", "A Whole New World", "Livin' la Vida Loca", "Mr. Brightside",
      "Seven Nation Army", "Levitating", "Anti-Hero", "Flowers", "Lose Yourself", "Ice Ice Baby", "Cotton Eye Joe",
      "Purple Rain", "Born in the U.S.A.", "What a Wonderful World", "La Bamba", "Jolene", "9 to 5",
      "Man! I Feel Like a Woman!", "Can't Stop the Feeling!"
    ]
  },
  movies: {
    easy: [
      "Titanic", "Star Wars", "The Lion King", "Frozen", "Toy Story", "Finding Nemo", "Shrek", "Spider-Man",
      "Batman", "Superman", "Iron Man", "Black Panther", "Wonder Woman", "E.T.", "Home Alone", "The Matrix",
      "Top Gun", "Rocky", "Pirates of the Caribbean", "Up", "Cars", "Aladdin", "Beauty and the Beast",
      "The Little Mermaid", "Cinderella", "Snow White", "Mary Poppins", "Kung Fu Panda", "Ice Age", "Elf",
      "The Grinch", "Men in Black", "The Karate Kid", "Dirty Dancing", "Fast & Furious", "Mission: Impossible",
      "James Bond", "Transformers", "Dumbo", "Tarzan", "101 Dalmatians", "Twister"
    ],
    hard: [
      "Avatar", "The Avengers", "Back to the Future", "Forrest Gump", "Grease", "Mean Girls", "The Godfather",
      "Indiana Jones", "The Incredibles", "Moana", "The Sound of Music", "Mamma Mia!", "Barbie", "Inside Out",
      "Ratatouille", "WALL-E", "Zootopia", "Despicable Me", "Madagascar", "Night at the Museum", "Jumanji",
      "Mrs. Doubtfire", "Pretty Woman", "The Notebook", "Legally Blonde", "Clueless", "Napoleon Dynamite",
      "Anchorman", "Space Jam", "Free Willy", "Willy Wonka & the Chocolate Factory", "The Princess Bride",
      "Ferris Bueller's Day Off", "The Breakfast Club", "Gladiator", "Braveheart", "Star Trek", "Bambi", "Tangled",
      "Encanto", "Lilo & Stitch", "Mulan", "Cast Away", "The Truman Show", "Groundhog Day", "Big", "Speed",
      "Armageddon", "Independence Day", "Gravity", "Interstellar", "Inception", "The Wizard of Oz"
    ]
  },
  actions: {
    easy: [
      "Brushing your teeth", "Riding a bike", "Swimming", "Driving a car", "Washing dishes", "Taking a selfie",
      "Playing guitar", "Playing piano", "Playing drums", "Fishing", "Surfing", "Skiing", "Ice skating", "Bowling",
      "Golfing", "Playing tennis", "Shooting a basketball", "Kicking a soccer ball", "Pitching a baseball", "Boxing",
      "Doing yoga", "Lifting weights", "Jumping rope", "Hula hooping", "Juggling", "Walking a dog",
      "Changing a diaper", "Mowing the lawn", "Vacuuming", "Ironing clothes", "Folding laundry", "Making a bed",
      "Taking a shower", "Shaving", "Tying your shoes", "Sneezing", "Hiccups", "Blowing bubbles",
      "Blowing up a balloon", "Flying a kite", "Climbing a ladder", "Rock climbing", "Rowing a boat",
      "Riding a horse", "Milking a cow", "Flipping pancakes", "Eating spaghetti", "Drinking through a straw",
      "Texting", "Typing on a computer", "Painting a picture", "Snoring", "Sleepwalking", "Hailing a taxi",
      "Riding a roller coaster", "Skydiving", "Bungee jumping", "Walking a tightrope", "Doing a cartwheel",
      "Doing push-ups", "Dancing ballet", "Breakdancing", "Moonwalking", "Doing the floss",
      "Conducting an orchestra", "Directing traffic", "Giving a haircut", "Building a sandcastle",
      "Building a snowman", "Snowball fight", "Pillow fight", "Chopping wood", "Hammering a nail", "Washing a car",
      "Pushing a shopping cart", "Opening a present", "Blowing out birthday candles", "Wrapping a gift",
      "Peeling a banana", "Eating corn on the cob", "Licking an ice cream cone", "Chewing gum",
      "Getting stung by a bee", "Walking on hot sand", "Playing video games", "Hitting a piñata",
      "Doing a magic trick", "Proposing marriage", "Walking on the moon", "Playing hide and seek"
    ],
    hard: [
      "Waking up late", "Planting a garden", "Changing a tire", "Stepping on a Lego", "Taking a test"
    ]
  },
  books: {
    easy: [
      "The Cat in the Hat", "Green Eggs and Ham", "Goodnight Moon", "The Very Hungry Caterpillar",
      "Charlie and the Chocolate Factory", "James and the Giant Peach", "Winnie-the-Pooh", "Peter Pan", "Pinocchio",
      "The Giving Tree", "Where's Waldo?", "Captain Underpants", "The Lord of the Rings", "Animal Farm",
      "Romeo and Juliet", "Moby-Dick", "Treasure Island", "The Old Man and the Sea", "Holes", "Black Beauty",
      "The Jungle Book", "The Three Little Pigs", "Goldilocks and the Three Bears", "Little Red Riding Hood",
      "Jack and the Beanstalk", "The Tortoise and the Hare", "The Ugly Duckling", "The Princess and the Pea",
      "Curious George", "If You Give a Mouse a Cookie", "The Polar Express", "How the Grinch Stole Christmas",
      "A Christmas Carol", "Oliver Twist", "Gone Girl", "A Game of Thrones", "Brown Bear, Brown Bear"
    ],
    hard: [
      "Matilda", "The BFG", "The Little Prince", "Diary of a Wimpy Kid", "Percy Jackson", "The Chronicles of Narnia",
      "The Hobbit", "To Kill a Mockingbird", "The Great Gatsby", "1984", "Pride and Prejudice", "Hamlet",
      "The Odyssey", "Don Quixote", "Of Mice and Men", "The Catcher in the Rye", "Little Women", "Robinson Crusoe",
      "Gulliver's Travels", "Fahrenheit 451", "The Da Vinci Code", "The Fault in Our Stars",
      "The Hitchhiker's Guide to the Galaxy", "Dune", "The Giver", "Wonder", "Bridge to Terabithia",
      "The Secret Garden", "Anne of Green Gables", "Stuart Little", "Clifford the Big Red Dog", "Paddington",
      "The Gruffalo", "Les Misérables", "War and Peace", "The Art of War", "Life of Pi", "The Outsiders", "Hatchet",
      "Chicka Chicka Boom Boom", "The Little Engine That Could", "Where's Spot?", "The Velveteen Rabbit"
    ]
  },
  quotes: {
    easy: [
      "May the Force be with you", "I'll be back", "Houston, we have a problem", "To infinity and beyond!",
      "Just keep swimming", "Life is like a box of chocolates", "Show me the money!", "I'm the king of the world!",
      "There's no place like home", "E.T. phone home", "Piece of cake", "Monkey business", "In hot water", "D'oh!",
      "Just do it", "Got milk?", "Rock, paper, scissors", "Ready, set, go!", "Wax on, wax off", "Run, Forrest, run!",
      "Bond. James Bond.", "Luke, I am your father", "Live long and prosper", "Say cheese!", "Bless you",
      "Knock knock", "The floor is lava", "Sleep tight"
    ],
    hard: [
      "You can't handle the truth!", "Elementary, my dear Watson", "To be or not to be", "Break a leg",
      "Under the weather", "Hit the road", "Let the cat out of the bag", "Kick the bucket", "Spill the beans",
      "Cold feet", "Once in a blue moon", "When pigs fly", "Couch potato", "Head in the clouds",
      "Butterflies in my stomach", "Elephant in the room", "Hold your horses", "Barking up the wrong tree",
      "The early bird gets the worm", "Actions speak louder than words", "Don't cry over spilled milk",
      "Two peas in a pod", "Walking on eggshells", "Hit the hay", "Call it a day", "Cost an arm and a leg",
      "A picture is worth a thousand words", "Practice makes perfect", "Time flies", "Money doesn't grow on trees",
      "Easy peasy lemon squeezy", "See you later, alligator", "Yabba dabba doo!", "Cowabunga!", "Bazinga!",
      "Winter is coming", "I'm lovin' it", "Keep calm and carry on", "Hasta la vista, baby",
      "I feel the need for speed", "Why so serious?", "You talkin' to me?", "Toto, we're not in Kansas anymore",
      "Beam me up, Scotty", "Finders keepers", "Speak of the devil", "Bite off more than you can chew",
      "Burning the midnight oil", "Raining cats and dogs", "Back to square one", "On cloud nine", "Over the moon",
      "Ants in your pants", "All ears", "Wild goose chase", "Tip of the iceberg", "Hit the nail on the head"
    ]
  },
  chars: {
    easy: [
      "Mickey Mouse", "SpongeBob", "Mario", "Pikachu", "The Joker", "Wolverine", "The Hulk", "Captain America",
      "Thor", "Darth Vader", "Yoda", "Elsa", "Olaf", "Buzz Lightyear", "Santa Claus", "Easter Bunny", "Tooth Fairy",
      "Cupid", "Elvis Presley", "Michael Jackson", "Marilyn Monroe", "Abraham Lincoln", "Albert Einstein",
      "Cleopatra", "Sherlock Holmes", "Robin Hood", "Pirate", "Cowboy", "Ninja", "Robot", "Astronaut", "Mermaid",
      "Superhero", "Princess", "Knight", "Clown", "Mime", "Chef", "Firefighter", "Lifeguard", "Ballerina",
      "Bodybuilder", "Cheerleader", "Referee", "Magician", "Caveman", "Fairy", "Genie", "Unicorn", "Dinosaur",
      "Gorilla", "Kangaroo", "Penguin", "Elephant", "Monkey", "Snake", "Chicken", "Frog", "Shark", "Homer Simpson",
      "Bugs Bunny", "Popeye", "Tigger", "Pac-Man", "Big Bird", "Cookie Monster", "Kermit the Frog", "Tinker Bell",
      "Captain Hook", "Rapunzel", "Simba", "Gollum", "Gandalf", "Statue of Liberty", "Mr. Bean", "Charlie Chaplin",
      "Bob Ross", "Mona Lisa"
    ],
    hard: [
      "Hermione Granger", "Luke Skywalker", "Woody", "Donkey", "King Arthur", "Scooby-Doo", "Garfield",
      "Sonic the Hedgehog", "Peppa Pig", "Elmo", "Miss Piggy", "Ariel", "Dory", "Minion", "Taylor Swift", "Beyoncé",
      "Oprah"
    ]
  }
};
