import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://Aashishpropeorty:SATYAKA123@property.zn2cowc.mongodb.net/';
const DB_NAME = 'aashish_property';

async function initializeFooterData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for footer initialization');
    
    const db = client.db(DB_NAME);
    
    // Check if footer data exists
    const linksCount = await db.collection('footer_links').countDocuments();
    const settingsCount = await db.collection('footer_settings').countDocuments();
    
    console.log(`Existing footer data - Links: ${linksCount}, Settings: ${settingsCount}`);
    
    if (linksCount === 0) {
      const defaultLinks = [
        {
          title: 'Quick Buy',
          url: '/buy',
          section: 'quick_links',
          order: 1,
          isActive: true,
          isExternal: false
        },
        {
          title: 'Quick Sale',
          url: '/sale', 
          section: 'quick_links',
          order: 2,
          isActive: true,
          isExternal: false
        },
        {
          title: 'Rental Properties',
          url: '/rent',
          section: 'quick_links', 
          order: 3,
          isActive: true,
          isExternal: false
        },
        {
          title: 'Contact Support',
          url: '/contact',
          section: 'support',
          order: 1,
          isActive: true,
          isExternal: false
        },
        {
          title: 'Privacy Policy',
          url: '/privacy',
          section: 'legal',
          order: 1,
          isActive: true,
          isExternal: false
        }
      ];
      
      await db.collection('footer_links').insertMany(defaultLinks);
      console.log(`✅ Created ${defaultLinks.length} default footer links`);
    }
    
    if (settingsCount === 0) {
      const defaultSettings = {
        companyName: 'Aashish Properties',
        companyDescription: 'Your trusted property partner in Rohtak. Find your dream home with verified listings and expert guidance.',
        companyLogo: 'AP',
        socialLinks: {
          facebook: 'https://facebook.com/aashishproperties',
          instagram: 'https://instagram.com/aashishproperties'
        },
        contactInfo: {
          phone: '+91 9876543210',
          email: 'info@aashishproperty.com',
          address: 'Rohtak, Haryana, India'
        },
        showLocations: true,
        locations: ['Model Town', 'Sector 14', 'Civil Lines', 'Old City', 'Industrial Area', 'Bohar'],
        customSections: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('footer_settings').insertOne(defaultSettings);
      console.log('✅ Created default footer settings');
    }
    
    console.log('🎉 Footer data initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize footer data:', error);
  } finally {
    await client.close();
  }
}

initializeFooterData();
