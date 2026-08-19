import { FaUsers, FaUserSecret, FaMagic, FaUser, FaHeart, FaList, FaHistory, FaBell, FaVideo, FaCrown, FaFilm } from "react-icons/fa";
import { MdCategory, MdDashboard, MdLocalMovies, MdOutlinePriceChange } from "react-icons/md";
import { RiVipDiamondFill } from "react-icons/ri";

export const LISTCLIENT = [
    {
        title: "Home",
        path: "/",
    },
    {
        title: "Thể loại",
        path: "/category",
    },
    {
        title: "Phim lẻ",
        path: "/singleMovies",
    },
    {
        title: "Phim bộ",
        path: "/series",
    },
    {
        title: "Chủ đề",
        path: "/topic",
    },
    {
        title: "Quốc gia",
        path: "/country",
    },
    {
        title: "Diễn viên",
        path: "/actors",
    },
    {
        title: "Lịch chiếu",
        path: "/showtimes",
    }
];


export const LISTMENU = [
    {
        name: "Meta Data",
        icon: <MdCategory />,
        subMenu: [
            {
                title: "Categories",
                path: "/categories"
            },
            {
                title: "Category Type",
                path: "/categoryTypes"
            },
            {
                title: "Topics",
                path: "/topics"
            }
        ]
    },
    {
        name: "Media",
        icon: <MdLocalMovies />,
        subMenu: [
            {
                title: "Movies",
                path: "/movies"
            },
            {
                title: "Episodes",
                path: "/episodes"
            },
            {
                title: "ShowTimes",
                path: "/showTimes"
            }
        ]
    },
    {
        name: "Community",
        icon: <FaUsers />,
        subMenu: [
            {
                title: "Users",
                path: "/users"
            },
            {
                title: "Reviews",
                path: "/reviews"
            },
            {
                title: "Comments",
                path: "/comments"
            }
        ]
    },
    {
        name: "Entity",
        icon: <FaUserSecret />,
        subMenu: [
            {
                title: "Actors",
                path: "/actors"
            },
            {
                title: "Authors",
                path: "/authors"
            },
            {
                title: "Characters",
                path: "/characters"
            }
        ]
    },
    {
        name: "Vip",
        icon: <MdOutlinePriceChange />,
        subMenu: [
            {
                title: "Plans",
                path: "/plans"
            },
            {
                title: "Features",
                path: "/features"
            },
            {
                title: "Packages",
                path: "/packages"
            }
        ]
    },
    {
        name: "Bill",
        icon: <RiVipDiamondFill />,
        subMenu: [
            {
                title: "RentMovies",
                path: "/rentMovies"
            },
            {
                title: "Subscriptions",
                path: "/subscriptions"
            }
        ]
    },
    {
        name: "Magic Import",
        icon: <FaMagic />,
        path: "/magicImport"
    }

];

export const COUNTRIES = [
    "Âu Mỹ",
    "Quốc gia khác",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua và Barbuda",
    "Argentina",
    "Armenia",
    "Úc",
    "Áo",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Bỉ",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia và Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Campuchia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Cộng hòa Trung Phi",
    "Chad",
    "Chile",
    "Trung Quốc",
    "Colombia",
    "Comoros",
    "Congo (Brazzaville)",
    "Congo (Kinshasa)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Síp",
    "Cộng hòa Séc",
    "Đan Mạch",
    "Djibouti",
    "Dominica",
    "Cộng hòa Dominica",
    "Ecuador",
    "Ai Cập",
    "El Salvador",
    "Guinea Xích đạo",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Phần Lan",
    "Pháp",
    "Gabon",
    "Gambia",
    "Georgia",
    "Đức",
    "Ghana",
    "Hy Lạp",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "Ấn Độ",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Ý",
    "Jamaica",
    "Nhật Bản",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Lào",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Quần đảo Marshall",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mông Cổ",
    "Montenegro",
    "Ma-rốc",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Hà Lan",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Triều Tiên",
    "Bắc Macedonia",
    "Na Uy",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Ba Lan",
    "Bồ Đào Nha",
    "Qatar",
    "Romania",
    "Nga",
    "Rwanda",
    "Saint Kitts và Nevis",
    "Saint Lucia",
    "Saint Vincent và Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome và Principe",
    "Ả Rập Xê Út",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Quần đảo Solomon",
    "Somalia",
    "Nam Phi",
    "Hàn Quốc",
    "Nam Sudan",
    "Tây Ban Nha",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Thụy Điển",
    "Thụy Sĩ",
    "Syria",
    "Đài Loan",
    "Tajikistan",
    "Tanzania",
    "Thái Lan",
    "Đông Timor",
    "Togo",
    "Tonga",
    "Trinidad và Tobago",
    "Tunisia",
    "Thổ Nhĩ Kỳ",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "UAE",
    "Anh",
    "Mỹ",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican",
    "Venezuela",
    "Việt Nam",
    "Yemen",
    "Zambia",
    "Hồng Kông"
];

export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};
export const cloud_name = "duuujvsz7";

export const initialOptions = {
    "client-id": "ASp6S6y6wWcAw1YZuOjr5nCJpZT_y7eCM_ywJBfXiZ_OZKC3Q91DvvylF8Z2zeGa5r2UdqgILlHGgDgv",
    currency: "USD",
    intent: "capture"
};

export const LISTACCOUNT = [
    {
        name: "Tài Khoản",
        icon: <FaUser />,
        path: "/account/account"
    },
    {
        name: "Yêu Thích",
        icon: <FaHeart />,
        path: "/account/favorites"
    },
    {
        name: "Danh Sách",
        icon: <FaList />,
        path: "/account/list"
    },
    {
        name: "Xem Tiếp",
        icon: <FaHistory />,
        path: "/account/history"
    },
    {
        name: "Thông Báo",
        icon: <FaBell />,
        path: "/account/notifications"
    },
    {
        name: "Gói Đăng Ký",
        icon: <FaCrown />,
        path: "/account/subscriptions"
    },
    {
        name: "Phim Đang Thuê",
        icon: <FaFilm />,
        path: "/account/rentMovies"
    }
];

export const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
export const apiKeys = (import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "")
    .split(',')
    .map(k => k.trim().replace(/[\r\n\\"]/g, ''))
    .filter(Boolean);

export const YOUR_SERVICE_ID = "service_wrbu7og";
export const REGISTER_PLAN = "template_8wkt467"; // đk gói
export const NEW_EPISODE = "template_c5ocp4e"; // tập mới ra
export const YOUR_USER_ID = "RmhLUxDSJVZ5LuXSd";
export const CONFIRM_CODE = "template_h0wht88";
