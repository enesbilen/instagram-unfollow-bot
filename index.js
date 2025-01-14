require('dotenv').config();
const puppeteer = require('puppeteer');

async function runTest() {
    try {
        // Tarayıcıyı başlat
        const browser = await puppeteer.launch({
            headless: false, // Test sürecini görebilmek için false
            defaultViewport: null,
            args: ['--start-maximized']
        });

        // Yeni sayfa aç
        const page = await browser.newPage();

        // Instagram login sayfasına git
        await page.goto('https://www.instagram.com/accounts/login/?source=logged_out_megaphone_signup', {
            waitUntil: 'networkidle0'
        });

        // Form elementlerini bekle
        await page.waitForSelector('input[name="username"]');
        await page.waitForSelector('input[name="password"]');

        // Kullanıcı adı ve şifre gir
        await page.type('input[name="username"]', process.env.INSTAGRAM_USERNAME);
        await page.type('input[name="password"]', process.env.INSTAGRAM_PASSWORD);
        
        console.log('Kullanıcı bilgileri girildi');

        // Submit butonunu bekle ve tıkla
        await page.waitForSelector('button[type="submit"]');
        await page.click('button[type="submit"]');
        
        console.log('Giriş yap butonuna tıklandı');

        // Ana sayfanın yüklenmesini bekle
        await page.waitForTimeout(10000);
        
        // Profil sayfasına git
        await page.goto(process.env.INSTAGRAM_PROFILE_URL, {
            waitUntil: 'networkidle0'
        });
        
        // Profil sayfasının yüklenmesini bekle
        await page.waitForTimeout(5000);
        console.log('Profil sayfasına gidildi');

        // Following linkini bul ve tıkla
        const profileUsername = process.env.INSTAGRAM_USERNAME;
        await page.waitForSelector(`a[href="/${profileUsername}/following/"]`);
        await page.click(`a[href="/${profileUsername}/following/"]`);
        
        // Following sayfasının yüklenmesini bekle
        await page.waitForTimeout(10000);
        
        // Scrollview'in yüklenmesini bekle
        await page.waitForSelector('#scrollview');
        console.log('Takip edilenler listesi yüklendi');

        // Takipten çıkma işlemi için sayaç
        let unfollowCount = 0;

        // Her 5 saniyede bir takipten çık
        const interval = setInterval(async () => {
            try {
                // "Takiptesin" butonlarını bul
                const followingButtons = await page.$$('button[type="button"]');
                
                // Takiptesin yazısı içeren butonu bul
                for (const button of followingButtons) {
                    const buttonText = await page.evaluate(el => el.textContent, button);
                    if (buttonText.includes('Takiptesin')) {
                        await button.click();
                        console.log('Takiptesin butonuna tıklandı');
                        break;
                    }
                }
                
                // Modal'ın açılmasını bekle
                await page.waitForTimeout(2000);
                
                // "Takibi Bırak" butonunu bul ve tıkla
                const unfollowButton = await page.$$('button');
                for (const button of unfollowButton) {
                    const buttonText = await page.evaluate(el => el.textContent, button);
                    if (buttonText.includes('Takibi Bırak')) {
                        await button.click();
                        unfollowCount++;
                        console.log(`${unfollowCount} kişi takipten çıkarıldı`);
                        break;
                    }
                }

                // İşlem bittikten sonra bekle
                await page.waitForTimeout(8000);

            } catch (error) {
                console.error('Takipten çıkarma sırasında hata:', error);
                clearInterval(interval);
            }
        }, 5000);

        // Sayfayı açık tut
        // await browser.close();
    } catch (error) {
        console.error('Test sırasında bir hata oluştu:', error);
    }
}

// Testi çalıştır
runTest();
