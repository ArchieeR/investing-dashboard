Right we need to look at the calculations again. its really simple. 

need to take ourtime to try fix this.

---

# We have 2 sets of calcuations:

## Calculations based/linked to Quanitity x Live Price:

- Live Value - Live price x Q

- Total allocated value (live) - this is the total of all the live values. So this is the value of stocks that I have allocated quanitity to.

- % of Portfolio (uses allocated value)
- Section total live
- % of section
- Theme total live
- % of theme - Uses live theme total

### Profit/Loss which uses live price:
- share bought at
- date bought at
- total gain = (share price bought at - live price) x Quanitity. Could be multiple share prices and dates for a holdings so note.

# Then we have a seperate, theoretical set of calculations which are used alongside it:

- Target portfolio value - So for context I may have a set of stocks that I have plugged into the live calculations, but I want to change them/make a new portfolio. The target stuff acts as a drafting/experimentation overlay.

- So i set target portfolio value at top of holding table.


## In allocation manager, there's sections/themes, and accounts tab.

Sections/Themes tab uses a dropdown list drag and drop.

Section line need 3 columns:
- Allocated live value (to that section)
- Percentage - that I choose.
- And consequantial target value for the section - Target portfolio value x section %

then in the theme list, which is a part of the section dropdown list in ui:
This has 3 columns aswell
- allocated live value (of that theme)
- percentage - that I choose.
- And consequantial target value for the theme - Target section value x theme %

An Important thing to note with the percentages that are set here, is I could change the section percentage, but I need the theme percentages to stay the same.

So if I changed one thing, it doesnt update the fields the editable fields, just the other calculations.

Same with fields in Holdings table



# Example calculations:

target portfolio budget 10000

section 1 is 55%  so 5500

Then within that:

theme 1 10% £550

theme 2 20% £1100

theme 3 50% £2750

then asset AAPL is 10£ of theme 1 = £ 5