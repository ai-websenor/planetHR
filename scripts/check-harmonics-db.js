const { MongoClient } = require('mongodb');

async function checkHarmonicsData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/planetshr_dev';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Get the latest employee
    const employees = await db.collection('employees')
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (employees.length === 0) {
      console.log('❌ No employees found in database');
      return;
    }

    const employee = employees[0];
    const employeeId = employee._id.toString();

    console.log('📋 Latest Employee:');
    console.log(`   ID: ${employeeId}`);
    console.log(`   Name: ${employee.personalInfo?.firstName} ${employee.personalInfo?.lastName}`);
    console.log(`   Created: ${employee.createdAt}\n`);

    // Check BaseHarmonics collection
    const baseHarmonics = await db.collection('baseharmonics')
      .findOne({ employeeId });

    console.log('🔮 Base Harmonics:');
    if (baseHarmonics) {
      console.log(`   ✅ Found - Document ID: ${baseHarmonics._id}`);
      console.log(`   Raw Scores: ${baseHarmonics.rawScores?.length || 0} harmonics`);
      console.log(`   Normalized Scores: ${baseHarmonics.normalizedScores?.length || 0}`);
      console.log(`   Statistics: Mean=${baseHarmonics.statistics?.mean?.toFixed(2)}, StdDev=${baseHarmonics.statistics?.stdDev?.toFixed(2)}`);
      console.log(`   Top Core Traits: ${baseHarmonics.topHarmonicsByCluster?.coreTrait?.length || 0}`);
      console.log(`   Natal Positions: ${baseHarmonics.natalPositions?.length || 0} planets`);
      console.log(`   Calculated At: ${baseHarmonics.calculatedAt}`);
    } else {
      console.log('   ❌ Not found');
    }

    // Check AgeHarmonics collection
    const ageHarmonics = await db.collection('ageharmonics')
      .find({ employeeId })
      .sort({ calculatedForDate: -1 })
      .limit(1)
      .toArray();

    console.log('\n⏰ Age Harmonics:');
    if (ageHarmonics.length > 0) {
      const latest = ageHarmonics[0];
      console.log(`   ✅ Found - Document ID: ${latest._id}`);
      console.log(`   Decimal Age: ${latest.decimalAge?.toFixed(2)} years`);
      console.log(`   Calculated For: ${latest.calculatedForDate}`);
      console.log(`   Raw Scores: ${latest.rawScores?.length || 0} harmonics`);
      console.log(`   Normalized Scores: ${latest.normalizedScores?.length || 0}`);
      console.log(`   Top Core Traits: ${latest.topHarmonicsByCluster?.coreTrait?.length || 0}`);
    } else {
      console.log('   ❌ Not found');
    }

    // Check RoleInsights collection
    const roleInsights = await db.collection('roleinsights')
      .find({ employeeId })
      .toArray();

    console.log('\n👔 Role Insights:');
    if (roleInsights.length > 0) {
      console.log(`   ✅ Found ${roleInsights.length} role insights`);
      roleInsights.forEach(ri => {
        console.log(`   - ${ri.role.toUpperCase()}: ${ri.baseInsights?.length || 0} base insights, ${ri.ageInsights?.length || 0} age insights`);
        console.log(`     Promotion Score: ${ri.promotionReadiness?.score || 'N/A'}`);
      });
    } else {
      console.log('   ❌ Not found');
    }

    // Check Employee energyCode reference
    console.log('\n🔗 Employee Harmonic References:');
    if (employee.energyCode?.harmonicReferences) {
      const ref = employee.energyCode.harmonicReferences;
      console.log(`   ✅ Has Base Harmonics: ${ref.hasBaseHarmonics}`);
      console.log(`   ✅ Has Age Harmonics: ${ref.hasAgeHarmonics}`);
      console.log(`   Last Calculated: ${ref.lastCalculated}`);
      console.log(`   Next Update: ${ref.nextUpdate}`);
    } else {
      console.log('   ❌ Not found in employee record');
    }

    if (employee.energyCode?.quickInsights) {
      const insights = employee.energyCode.quickInsights;
      console.log(`   Top Energy Codes: ${insights.topEnergyCodes?.join(', ') || 'N/A'}`);
      console.log(`   Dominant Cluster: ${insights.dominantCluster || 'N/A'}`);
      console.log(`   Current Role: ${insights.currentRole || 'N/A'}`);
    }

    // Check AstrologyApiLog collection
    const apiLogs = await db.collection('astrologyapilogs')
      .find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log('\n📞 Astrology API Logs:');
    if (apiLogs.length > 0) {
      console.log(`   ✅ Found ${apiLogs.length} API call(s)`);
      apiLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. Status: ${log.status.toUpperCase()}`);
        console.log(`      Endpoint: ${log.endpoint}`);
        console.log(`      Response Time: ${log.responseTime}ms`);
        console.log(`      Planets Extracted: ${log.planetsExtracted}`);
        console.log(`      Houses Extracted: ${log.housesExtracted}`);
        console.log(`      HTTP Status: ${log.httpStatus}`);
        console.log(`      Timestamp: ${log.requestedAt}`);
        if (log.status === 'failed' && log.errorDetails) {
          console.log(`      Error: ${log.errorDetails.message}`);
        }
        if (log.planetNames && log.planetNames.length > 0) {
          console.log(`      Planets: ${log.planetNames.join(', ')}`);
        }
      });
    } else {
      console.log('   ❌ Not found');
    }

    console.log('\n✨ Database Check Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkHarmonicsData();
