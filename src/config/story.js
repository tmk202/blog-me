/**
 * Story Configuration
 * 4 Chapters: Day -> Crimson -> Frozen -> Cyber
 */

export const STORY_CONFIG = {
    settings: {
        debug: false,
        scrollSpeed: 1,
        transitionDuration: 2.5,
    },
    tropicalAssets: [],
    parts: [
        {
            id: 'day',
            title: 'Hành Trình của Huyền dê',
            subtitle: 'THE SPARK OF CREATION',
            content: 'Bắt đầu cuộc hành trình dưới ánh mặt trời rực rỡ, nơi mọi ý tưởng nảy mầm từ những hạt cát nhỏ nhất.',
            theme: {
                backgroundColor: '#ffe0b2', // Warm morning sky
                primaryColor: '#ef6c00',    
                secondaryColor: '#1a1a1a',
                groundColor: '#ffffff', // Neutral tint
                celestial: { type: 'sun', color: '#ffb703', pos: { x: -15, y: 4, z: -60 }, scale: 8.5 }
            }
        },
        {
            id: 'crimson',
            title: 'Thung Lũng Rực Lửa',
            subtitle: 'THE HEAT OF CHALLENGE',
            content: 'Dưới cái nắng gắt của thực tế, chỉ những ai bền bỉ nhất mới thấy được vẻ đẹp của sự nỗ lực vượt bậc.',
            theme: {
                backgroundColor: '#bf360c', // Deep Crimson
                primaryColor: '#ff9e80',    
                secondaryColor: '#ffffff',
                groundColor: '#ffab91', // Reddish tint
                celestial: { type: 'sun', color: '#d84315', pos: { x: -15, y: 8, z: -60 }, scale: 12.0 }
            }
        },
        {
            id: 'frozen',
            title: 'Đêm Băng Giá',
            subtitle: 'THE CALM REFLECTION',
            content: 'Sự tĩnh lặng tuyệt đối. Đây là lúc những ý tưởng vĩ đại nhất xuất hiện dưới bầu trời sao bao la.',
            theme: {
                backgroundColor: '#001219', // Deep Arctic Navy
                primaryColor: '#90e0ef',    
                secondaryColor: '#ffffff',
                groundColor: '#caf0f8', // Frozen tint
                celestial: { type: 'moon', color: '#e0f7fa', pos: { x: -10, y: 6, z: -60 }, scale: 6.0 }
            }
        },
        {
            id: 'cyber',
            title: 'Hành Trình của Huyền xinh',
            subtitle: 'THE PIXEL HORIZON',
            content: 'Dưới bầu trời sao vô tận, ta nhận ra rằng đích đến không phải là điểm dừng, mà là khởi đầu cho những tầm nhìn mới.',
            theme: {
                backgroundColor: '#4a148c', // Cyber Purple
                primaryColor: '#ea80fc',    
                secondaryColor: '#ffffff',
                groundColor: '#e1bee7', // Purple tint
                celestial: { type: 'moon', color: '#f3e5f5', pos: { x: -10, y: 10, z: -60 }, scale: 4.5 }
            }
        }
    ]
};
