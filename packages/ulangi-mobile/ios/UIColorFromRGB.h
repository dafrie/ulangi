//
//  UIColorFromRGB.h
//  UlangiMobile
//
//  Created by Minh Loi on 8/25/18.
//  Copyright © 2018 Ulangi. All rights reserved.
//

#ifndef UIColorFromRGB_h
#define UIColorFromRGB_h

#define UIColorFromRGB(rgbValue) \
[UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 \
green:((float)((rgbValue & 0x00FF00) >>  8))/255.0 \
blue:((float)((rgbValue & 0x0000FF) >>  0))/255.0 \
alpha:1.0]

#endif /* UIColorFromRGB_h */
