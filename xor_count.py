import math
def xor_count_trinomial(m, a):
    total_a = m - 1
    total_0 = triangle(m, a, 0)
    if a % (m - a) == 0:
        discount = 2 * (m - 1 - a)
    else:
        discount = 0
    return total_a + total_0 - discount

def triangle(m, a, start_step):
    ka = int((m-2)/(m-a)) + 1
    full_triangle = (ka*(ka+1)/2) * (m - a)
    lines_cut = ka * (m - a) - (m - 1)
    total_cut = lines_cut * ka
    return full_triangle - total_cut
    
for m in range(3, 30):
    print m, ':',
    for a in range(2, m):
        ka = int((m-2)/(m-a)) + 1
        print xor_count_trinomial(m, a) - xor_count_trinomial(m, a-1) - 1 - ka,
    print ''


step_size = a%2