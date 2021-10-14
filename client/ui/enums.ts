// Copy every enum defined in ui component here;

export module ENum {
    export const enum EButtonStyle {
        Default = 1 << 0,
        Primary = 1 << 1,
        Success = 1 << 2,
        Info    = 1 << 3,
        Warning = 1 << 4,
        Danger  = 1 << 5,
        Link    = 1 << 6,
    
        ExtraSmall   = 1 << 7,
        Small   = 1 << 8,
        Medium  = 1 << 9,
        Large   = 1 << 10,
        Dark    = 1 << 11,
    }
}