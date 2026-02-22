/**
 * Seed Script — Seeds all BMSCE Clubs into the database
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Club = require('./models/Club');

const CLUBS = [
    // Social Clubs
    { category: 'Social Clubs', clubName: 'National Service Scheme (NSS)' },
    { category: 'Social Clubs', clubName: 'Leo Satva' },
    { category: 'Social Clubs', clubName: 'BMSCE ISRC' },
    { category: 'Social Clubs', clubName: 'Rotaract Club of BMSCE' },
    { category: 'Social Clubs', clubName: 'Mountaineering Club of BMSCE (BMSCEMC)' },
    { category: 'Social Clubs', clubName: 'Yoga Club' },

    // Cultural Clubs
    { category: 'Cultural Clubs', clubName: 'The Groovehouse – Western Music' },
    { category: 'Cultural Clubs', clubName: 'Ninaad – Eastern Music' },
    { category: 'Cultural Clubs', clubName: 'Paramvah – Eastern Dance Team' },
    { category: 'Cultural Clubs', clubName: 'DanzAddix – Western Dance Team' },
    { category: 'Cultural Clubs', clubName: 'Chiranthana Kannada Sangha' },
    { category: 'Cultural Clubs', clubName: 'Samskruthi Sambhrama' },
    { category: 'Cultural Clubs', clubName: 'Pravrutthi – Theatre Team' },
    { category: 'Cultural Clubs', clubName: 'PANACHE – Fashion Team' },
    { category: 'Cultural Clubs', clubName: 'Fine Arts Club' },
    { category: 'Cultural Clubs', clubName: 'Falcons of BMSCE – Multimedia Team' },

    // Quiz Club
    { category: 'Quiz Club', clubName: 'Qcaine – BMSCE Quiz Club' },

    // Gaming Club
    { category: 'Gaming Club', clubName: 'RESPAWN – Gaming Club' },

    // Professional Bodies
    { category: 'Professional Bodies', clubName: 'BMSCE IEEE Student Branch SB' },
    { category: 'Professional Bodies', clubName: 'BMSCE ACM Student Chapter' },

    // Coding Clubs
    { category: 'Coding Clubs', clubName: 'Google Developer Groups on Campus – Web Development' },
    { category: 'Coding Clubs', clubName: 'Teamcodelocked – Technical Club' },
    { category: 'Coding Clubs', clubName: 'Augment AI – Artificial Intelligence Club' },

    // Technical Clubs
    { category: 'Technical Clubs', clubName: 'Singularity – The Astronomical Society of BMSCE' },
    { category: 'Technical Clubs', clubName: 'Upagraha – Design, Build and Launch a Student Satellite' },
    { category: 'Technical Clubs', clubName: 'Bullz Racing – Formula Student Team' },
    { category: 'Technical Clubs', clubName: 'Pentagram – Mathematical Society' },
    { category: 'Technical Clubs', clubName: 'Aero BMSCE – Aeromodelling Club' },
    { category: 'Technical Clubs', clubName: 'Rocketry – Rocket Club' },
    { category: 'Technical Clubs', clubName: 'Robotics Club' },
    { category: 'Technical Clubs', clubName: 'CorTechs – The Innovation & Technology Hub' },

    // Business Related Clubs
    { category: 'Business Related Clubs', clubName: 'BIG Foundation' },
    { category: 'Business Related Clubs', clubName: 'BMS MUNSoc – Model United Nations Society' },
    { category: 'Business Related Clubs', clubName: 'Business Insights' },
    { category: 'Business Related Clubs', clubName: 'IIC – Building Innovation and Entrepreneurship Ecosystem' },
    { category: 'Business Related Clubs', clubName: 'Inksanity – Literary and Debating Society of BMSCE' },
];

const seedClubs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Drop existing clubs and re-seed
        await Club.deleteMany({});
        console.log('🗑️  Cleared existing clubs');

        await Club.insertMany(CLUBS.map(c => ({ ...c, isActive: true })));
        console.log(`🎉 Seeded ${CLUBS.length} clubs successfully!`);

        // Print summary
        const categories = [...new Set(CLUBS.map(c => c.category))];
        categories.forEach(cat => {
            const count = CLUBS.filter(c => c.category === cat).length;
            console.log(`   📌 ${cat}: ${count} clubs`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
};

seedClubs();
