/**
 * Story Configuration
 * As a Senior Frontend Engineer, we keep data decoupled from logic.
 * You can easily add more parts here by following the schema.
 */

export const STORY_CONFIG = {
    settings: {
        debug: false,
        scrollSpeed: 1,
        transitionDuration: 2, // seconds
    },
    tropicalAssets: [
        { texture: '/assets/1.png', pos: { x: -10, y: 2, z: -5 }, scale: 5, parallax: 1.5 },
        { texture: '/assets/2.png', pos: { x: -5, y: -3, z: -2 }, scale: 4, parallax: 1.2 },
        { texture: '/assets/1.png', pos: { x: 5, y: 4, z: -8 }, scale: 6, parallax: 0.8 },
        { texture: '/assets/2.png', pos: { x: 12, y: -1, z: -4 }, scale: 5, parallax: 1.3 },
        { texture: '/assets/1.png', pos: { x: 20, y: 1, z: -6 }, scale: 4, parallax: 1.1 },
        { texture: '/assets/2.png', pos: { x: 30, y: -2, z: -3 }, scale: 7, parallax: 0.9 }
    ],
    parts: [
        {
            id: 'childhood',
            title: 'Khơi Nguồn',
            subtitle: '1995 - 2005',
            content: 'Nơi hạt mầm bắt đầu nảy nở trong sự tò mò vô hạn về thế giới xung quanh.',
            theme: {
                backgroundColor: '#ffffff',
                primaryColor: '#2d5a27',
                secondaryColor: '#1a1a1a',
                fogColor: '#ffffff'
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 0 // Progress value for this part
            }
        },
        {
            id: 'discovery',
            title: 'Khám Phá',
            subtitle: '2005 - 2015',
            content: 'Kỷ nguyên của những dòng code đầu tiên và khát khao chinh phục kiến thức.',
            theme: {
                backgroundColor: '#ffffff',
                primaryColor: '#8eb021',
                secondaryColor: '#1a1a1a',
                fogColor: '#ffffff'
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 0.25
            }
        },
        {
            id: 'challenges',
            title: 'Thử Thách',
            subtitle: '2015 - 2023',
            content: 'Đối mặt với những dự án lớn, những đêm trắng và sự trưởng thành trong tư duy.',
            theme: {
                backgroundColor: '#ffffff',
                primaryColor: '#d2b48c',
                secondaryColor: '#1a1a1a',
                fogColor: '#ffffff'
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 0.5
            }
        },
        {
            id: 'vision',
            title: 'Tầm Nhìn',
            subtitle: '2024 & Beyond',
            content: 'Kiến tạo tương lai với AI và những công nghệ thay đổi thế giới.',
            theme: {
                backgroundColor: '#ffffff',
                primaryColor: '#008080',
                secondaryColor: '#1a1a1a',
                fogColor: '#ffffff'
            },
            scene: {
                cameraPos: { x: 0, y: 0, z: 12 },
                progress: 0.75
            }
        }
    ]
};
